import logging
from crispy_forms.layout import Layout
from django.utils.safestring import mark_safe
from django import forms
from tom_observations.facility import BaseObservationForm, BaseObservationFacility
from tom_observations.facility import BaseRoboticObservationFacility, BaseRoboticObservationForm 
from tom_observations.observation_template import GenericTemplateForm
from tom_keck.keck_api import KeckAPI

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

KECK_TOO_INSTRUMENT_CHOICES=[
    ('HIRES','HIRES'),
    ('MOSFIRE','MOSFIRE'),
    ('LRIS','LRIS'),
    ('KPF','KPF'),
    ('OSIRIS','OSIRIS'),
    ('DEIMOS','DEIMOS'),
    ('ESI','ESI'),
    ('KCWI','KCWI'),
    ('NIRES','NIRES'),
    ('NIRC2','NIRC2'),
    ('NIRSPEC','NIRSPEC'),
]


KECK_INTERRUPT_TYPE = [
    ('Institution', 'Institution'), ('Partner', 'Partner')
]

KECK_FLEXTIME_CHOICES = [
    ('+/- 2 hours', '+/- 2 hours'),
    ('+/- 3 hours', '+/- 3 hours'),
]

OBSERVER_LOCATION = [ ('Remote', 'Remote'), ('Keck HQ', 'Keck HQ') ]
KECK_IMAGING_INSTRUMENT_CHOICES=[
    ('MOSFIRE', 'MOSFIRE'),
    ('LRIS', 'LRIS'),
    ('OSIRIS','OSIRIS'),
    ('DEIMOS','DEIMOS'),
    ('ESI','ESI'),
    ('KCWI','KCWI'),
    ('NIRC2','NIRC2'),
]

class KeckLoginForm(BaseObservationForm):
    """
    A form for logging into the Keck Observatory system.
    This form is used to authenticate users before they can submit observations.
    """
    title = 'Keck Login Form'
    description = mark_safe(
        f'This form is used to log in to the Keck Observatory system.'
    )

    email = forms.CharField(
        required=True,
        label='Keck Email',
        help_text='Enter your Keck affiliated email address.'
    )
    password = forms.CharField(
        required=True,
        label='Keck Password',
        widget=forms.PasswordInput,
        help_text='Enter your Keck account password.'
    )

    def layout(self):
        return Layout(
            'email',
            'password',
        )

    # def observation_payload(self):
    #     """Return payload for login form"""
    #     return {
    #         'email': self.cleaned_data.get('email', ''),
    #         'password': self.cleaned_data.get('password', '')
    #     }

    # def is_valid(self):
    #     """Override is_valid to ensure proper validation"""
    #     valid = super().is_valid()
    #     if valid:
    #         logger.debug(f'KeckLoginForm is valid with data: {self.cleaned_data}')
    #     else:
    #         logger.debug(f'KeckLoginForm validation failed with errors: {self.errors}')
    #     return valid


class KeckToOObservationForm(BaseObservationForm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # Set the form's title and description
        self.title = 'Keck Observation Form'
        self.description = mark_safe(
            f'This is a custom observation form for Keck.'
        )

    filler = [('input progid', 'input progid')]
    projcode = forms.ChoiceField(
        required=True,
        label='Project Code',
        choices=filler,
        initial=filler[0]
    )


    interrupt_date = forms.DateField(
        required=True,
        label='Night Date (YYYY-MM-DD HST)',
    )

    instrument = forms.ChoiceField(
        required=True,
        label='Instrument',
        choices=KECK_TOO_INSTRUMENT_CHOICES,
        initial=KECK_TOO_INSTRUMENT_CHOICES[0]
    )

    interrupt_type = forms.ChoiceField(
        required=True,
        label='Interrupt Type',
        choices=KECK_INTERRUPT_TYPE,
        initial=KECK_INTERRUPT_TYPE[0]
    )

    interrupt_time = forms.TimeField(
        required=True,
        label='Start Time (UTC)',
    )

    #
    # Optional TOO Request Details
    #
    flextime = forms.ChoiceField(
        required=False,
        label='Flexibility',
        choices=KECK_FLEXTIME_CHOICES,
        initial=KECK_FLEXTIME_CHOICES[0],
    )

    starlist = forms.FileField(
        required=False,
        label='Upload starlist',
    )

    target = forms.CharField(
        required=False,
        label='Target Name',
        help_text='What is the starlist name for this ToO target?',
        initial=''
    )

#    config = forms.CharField(
#        required=False,
#        label='Configuration and Sequence',
#        help_text='Insert your configuration and observation information.',
#        initial=''
#    )

#    duration = forms.CharField(
#        required=False,
#        label='Duration',
#        help_text='Duration of the ToO',
#        initial='1 hr'
#    )

    observer_location = forms.ChoiceField(
        required=False,
        label='Observer Location',
        choices=OBSERVER_LOCATION,
        initial=OBSERVER_LOCATION[0], #default to Other  
    )

    notes = forms.CharField(
        required=False,  # or True, depending on your use case
        label='Special Instructions',
        widget=forms.Textarea(attrs={
            'rows': 5,        # height of the textarea
            'cols': 40,       # width (can be omitted if using CSS)
            'placeholder': 'Enter any special notes here...',
        })
    )

    def is_valid(self):
        """Validate the form

        This method is called by the view's form_valid() method.
        """
        # TODO: check validity of doc-string
        super().is_valid()  # this adds cleaned_data to the form instance
        logger.debug(f'KeckObservationForm.is_valid -- cleaned_data: {self.cleaned_data}')

        # Comment out observation_payload call for now since method is not implemented
        # observation_payload = self.observation_payload()
        # logger.debug(f'KeckObservationForm.is_valid -- observation_payload: {observation_payload}')

        # BaseObservationForm.is_valid() says to make this call the Facility.validate_observation() method
        # observation_module = get_service_class(self.cleaned_data['facility'])

        # errors = observation_module().validate_observation(observation_payload)

        # if errors:
        #     self.add_error(None, errors)
        #     logger.debug(f'KeckObservationForm.is_valid -- errors: {errors}')

        if self._errors:
            logger.warning(f'Facility submission has errors {self._errors.as_data()}')

        # if add_error has not been called, then a success message will be displayed in the template
        return not self._errors

    def observation_payload(self):
        """Return payload for TOO observation form"""
        return {
            'projcode': self.cleaned_data.get('projcode', ''),
            'instrument': self.cleaned_data.get('instrument', ''),
            'interrupt_date': self.cleaned_data.get('interrupt_date', ''),
            'interrupt_time': self.cleaned_data.get('interrupt_time', ''),
            'interrupt_type': self.cleaned_data.get('interrupt_type', ''),
            'flextime': self.cleaned_data.get('flextime', ''),
            'starlist': self.cleaned_data.get('starlist', ''),
            'target': self.cleaned_data.get('target', ''),
            'observer_location': self.cleaned_data.get('observer_location', ''),
            'notes': self.cleaned_data.get('notes', ''),
        }

    def is_valid(self):
        """Override is_valid to ensure proper validation"""
        valid = super().is_valid()
        if valid:
            logger.debug(f'KeckToOObservationForm is valid with data: {self.cleaned_data}')
        else:
            logger.debug(f'KeckToOObservationForm validation failed with errors: {self.errors}')
        return valid

    def observation_payload(self):
        # self.userid=KeckAPI.validate_user()
        self.action='draft'
        self.tooid=None
        self.semester='2023B'
        self.duration="01:00:00"
        self.skipsubmitwarnings=1

        payload = {
            # 'submitterid': self.userid,
            'username': 'testname',
            'action': self.action, # either draft, edit, or submit
            'tooid': self.tooid,
            # 'piid': self.userid,
            'semester': self.semester,
            'projcode': self.cleaned_data['projcode'],
            'instrument': self.cleaned_data['instrument'],
            'obsdate': self.cleaned_data['interrupt_date'],
            'starttime': self.cleaned_data['innterrupt_time'],
            'duration': self.duration,
            'starlist': self.cleaned_data['starlist'],
            'target': self.cleaned_data['target'],
            'flextime': self.cleaned_data['flextime'],
            'obsdesignation': '',
            'obslocation': self.cleaned_data['observer_location'],
            'pinotes': self.cleaned_data['notes'],
            'interruptproj': self.cleaned_data['projcode'],
            'interrupttype': self.cleaned_data['interrupt_type'],
            'skipsubmitwarnings': self.skipsubmitwarnings,
            'instrconfigs': self.cleaned_data['config']
        }

        return payload

    def layout(self):
        return Layout(
            'projcode',
            'interrupt_date',
            'instrument',
            'interrupt_time',
            'interrupt_type',
            'flextime',
            'starlist',
            'observer_location',
            'notes',
        )

class KeckFacility(BaseObservationFacility):
    def __init__(self):
        super().__init__()
        # self.keck_api = KeckAPI()

        

    name = 'Keck'
    observation_types = [
        ('Keck Login', 'Keck Login'),
        ('Keck ToO Observation', 'Keck ToO Observation')
    ]

    observation_forms = {
        'Keck Login': KeckLoginForm,
        'Keck ToO Observation': KeckToOObservationForm,
    }

    template_name = 'tom_keck/observation_form.html'

    SITES = {
        'W. M. Keck Observatory': {
            'sitecode': 'keck',
            'latitude': 19.8267,
            'longitude': -155.4733,
            'elevation': 4123
        },
    }

    def get_form(self, observation_type):
        logger.debug(f'KeckFacility.get_form called with observation_type: {observation_type}')
        logger.debug(f'Available forms: {list(self.observation_forms.keys())}')
        form_class = self.observation_forms.get(observation_type, KeckToOObservationForm)
        logger.debug(f'Returning form class: {form_class.__name__}')
        return form_class

    def get_observation_types(self):
        """Return the observation types for this facility"""
        return self.observation_types

    def get_observation_forms(self):
        """Return the observation forms for this facility"""
        return self.observation_forms

    def get_terminal_observing_states(self):
        return ['IN_PROGRESS', 'COMPLETED']

    def get_observation_url(self, observation_id):
        """
        """
        logger.debug('get_observation_url')
        return 'KeckFacility.get_observation_url()'

    def get_observing_sites(self):
        logger.debug('get_observing_sites')
        return self.SITES


    def validate_observation(self):
        """Perform a dry-run of submitting the observation."""
        validation_errors = []
        # validate the too
        logger.debug(f'validate_observation - calling too.validate():\n{self.keck_api.too}')
        too_is_valid = self.keck_api.too.validate()
        logger.debug(f'validate_observation response: {too_is_valid}')

        if not too_is_valid:
            logger.debug(f'validate_observation - too.status.errors: {self.keck_api.too.status.errors}')

            validation_errors = self.keck_api.too.status.errors

        return validation_errors

    def check_interrupt(self):
        logger.debug('calling too.getInterrupt()')
        self.keck_api.too.getInterruptData()
        logger.info(f'check_interrupt - too.status.errors: {self.keck_api.too.status.errors}')


    def save_observation(self, observation_payload):
        logger.debug(f'calling too.save() with payload: {observation_payload}')
        # self.keck_api.too.submit()
        # logger.info(f'save_observation - too.status.errors: {self.keck_api.too.status.errors}')

        # Generate a temporary observation ID for testing
        import time
        too_id = f"KECK_{int(time.time())}"
        logger.debug(f'Generated observation ID: {too_id}')
        
        return [too_id]

    def edit_observation(self, observation_payload):
        logger.debug(f'calling too.save() with payload: {observation_payload}')
        # self.keck_api.too.submit()
        # logger.info(f'edit_observation - too.status.errors: {self.keck_api.too.status.errors}')

    def submit_observation(self, observation_payload):
        logger.debug(f'calling too.submit() with payload: {observation_payload}')
        # self.keck_api.too.submit()
        # logger.info(f'submit_observation - too.status.errors: {self.keck_api.too.status.errors}')

        # Generate a temporary observation ID for testing
        import time
        too_id = f"KECK_{int(time.time())}"
        logger.debug(f'Generated observation ID: {too_id}')

        return [too_id]

    def cancel_observation(self):
        logger.debug('calling too.cancel()')
        self.keck_api.too.cancel()
        logger.info(f'cancel_observation - too.status.errors: {self.keck_api.too.status.errors}')

    def delete_observation(self):
        logger.debug('calling too.delete()')
        self.keck_api.too.delete()
        logger.info(f'delete_observation - too.status.errors: {self.keck_api.too.status.errors}')

    def get_facility_context_data(self, **kwargs):
        """Allow the facility to add additional context data to the template.

        This method is called by `tom_observations.views.ObservationCreateView.get_context_data()`.
        """
        logger.debug(f'KeckFacility.get_facility_context_data kwargs: {kwargs}')
        facility_context_data = super().get_facility_context_data(**kwargs)

        tort_url = 'https://www2.keck.hawaii.edu/inst/PILogin/too/TooRequestPage.php'

        logger.debug(f'KeckFacility.get_facility_context_data facility_context_data: {facility_context_data}')
        new_context_data = {
            'iframe_url': tort_url,
            'observation_form': KeckToOObservationForm,
            'login_form': KeckLoginForm,
        }
        # logger.debug(f'eso new_context_data: {new_context_data}')

        facility_context_data.update(new_context_data)
        # logger.debug(f'eso facility_context_data: {facility_context_data}')
        return facility_context_data