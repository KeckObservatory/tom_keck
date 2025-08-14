import logging
import pdb

from getpass import getpass
import requests
import os
from datetime import datetime

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

def get_semester(hstDate):
    """
    Returns the observing semester associated with the date.

    :param hstDate: The HST date (yyyy-mm-dd)
    :type hstDate: date
    :return: Semester
    :rtype: str
    """

    year, month, day = hstDate.split("-")
    sem = "A"
    if int(month) == 1:
        year = str(int(year) - 1)
        sem = "B"
    if int(month) >= 8:
        sem = "B"
    return f"{year}{sem}"

class KeckAPI:

    def __init__(self, debug=True, email=None, password=None):
        self.url = 'https://www3.keck.hawaii.edu'
        self.userid = '4866' 
        self.set_userinfo_and_cookies()
        self.set_userinfo()
        self.semester = get_semester(datetime.now().strftime('%Y-%m-%d'))
        self.progids = []
        self.get_user_progids()

    def set_userinfo_and_cookies(self):
        email = os.getenv('KECK_USERNAME', 'set Keck_USERNAME value in environment (affiliated email address)')
        password = os.getenv('KECK_PASSWORD', 'set Keck_PASSWORD value in environment (account password)')
        loginParams = {'email': email, 'password': password, 'url': self.url}
        loginResp = requests.get(url=f'{self.url}/login/script', params=loginParams)

        if loginResp.status_code == 401:
            print(loginResp)
            verification_token = input('input verification token from email sent.')
            verifParams = {'email': email, 'token': verification_token}
            verifResp = requests.post(url=f'{self.url}/login/verify_token', data=verifParams)
            assert verifResp.status_code == 200, f'{verifResp} not sucessfull'
            loginResp = requests.get(url=f'{self.url}/login/script', params=loginParams)

        apicookies = loginResp.json()
        uid = apicookies['py_uid']
        self.cookies = {"KECK-AUTH-UID": uid}
        logger.info(f'KeckAPI initialized with cookies')
    
    def set_userinfo(self):
        usrurl = f'{self.url}/userinfo/odb-cookie'
        userResp = requests.get(url=usrurl, cookies=self.cookies)
        assert userResp.status_code == 200, f'{userResp} not sucessfull'
        self.userinfo = userResp.json()
        self.userid = str(userResp.json()['Id'])
        logger.info(f'KeckAPI initialized with user ID: {self.userid}')

    def get_user_progids(self):
        toourl = f'{self.url}/api/too/getToo'
        params = {'semester': self.semester, 'obsid': self.userid}
        resp = requests.get(url=toourl, params=params, cookies=self.cookies)
        assert resp.status_code == 200, f'get user too programs {resp} not sucessfull'
        self.programs = resp.json()
        self.progids = [prog['ProgramID'] for prog in self.programs]
