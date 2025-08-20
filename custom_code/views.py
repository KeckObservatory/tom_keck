from django.shortcuts import render
from rest_framework.views import APIView
from django.http import JsonResponse
from rest_framework.permissions import AllowAny
import requests
import pdb
# Create your views here.

class KekeLogin(APIView):
    """
    View to handle Keck login.
    """
    permission_classes = [AllowAny]  # Allow any user to access this view
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        if not email or not password:
            return JsonResponse({'error': 'Email and password are required.'}, status=400)

        loginParams = {'email': email, 'password': password, 'url': 'https://www3.keck.hawaii.edu'}
        loginResp = requests.get(url='https://www3.keck.hawaii.edu/login/script', params=loginParams)

        if loginResp.status_code == 401:
            return JsonResponse({'error': 'Unauthorized. Please check your credentials.'}, status=401)
        loginBody = loginResp.json()
        return JsonResponse(loginBody, status=200)

KECK_URL = 'https://www3.keck.hawaii.edu'

def keke(request):
    return render(request, 'tom_keck/keke.html')

def keck_verify_token(request):
    email = request.POST.get('email')
    token = request.POST.get('token')
    if not email or not token:
        return JsonResponse({'error': 'Email and verification token are required.'}, status=400)
    
    verifParams = {'email': email, 'token': token}
    verifResp = requests.post(url=f'{KECK_URL}/login/verify_token', data=verifParams)
    
    if verifResp.status_code == 200:
        return JsonResponse({'message': 'Verification successful. Please log in again.'}, status=200)
    else:
        return JsonResponse({'error': 'Verification failed. Please check your token.'}, status=400)

def keck_get_userinfo(request):
    KECK_URL = 'https://www3.keck.hawaii.edu'
    uid = request.GET.get('uid')
    if not uid:
        return JsonResponse({'error': 'User not authenticated.'}, status=401)

    userinfoResp = requests.get(url=f'{KECK_URL}/userinfo/odb-cookie', cookies={'KECK-AUTH-UID': uid})
    if userinfoResp.status_code == 401:
        return JsonResponse({'error': 'Unauthorized. Please log in again.'}, status=401)
    if userinfoResp.status_code == 200:
        return JsonResponse(userinfoResp.json(), status=200)
    else:
        return JsonResponse({'error': 'Failed to retrieve user information.'}, status=userinfoResp.status_code)