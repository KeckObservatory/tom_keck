import logging
import pdb
from crispy_forms.layout import Layout
from django.utils.safestring import mark_safe
from django import forms
from tom_observations.facility import BaseObservationForm, BaseObservationFacility
from tom_observations.facility import BaseRoboticObservationFacility, BaseRoboticObservationForm 
from tom_observations.observation_template import GenericTemplateForm

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)


class KeckTooForm(BaseObservationForm):
    """
    A form for navigating to the Keck Observatory TOO tool.
    """
    title = 'Navigate to TOO Tool'
    description = mark_safe(
        f'This form is used to navigate to the Keck Observatory TOO tool.'
    )

    def layout(self):
        return Layout(
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
        'Keck Too Form': KeckTooForm,
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
        form_class = self.observation_forms.get(observation_type, KeckTooForm)
        logger.debug(f'Returning form class: {form_class.__name__}')
        return form_class

    def get_observation_url(self, observation_id):
        """
        """
        logger.debug('get_observation_url')
        return 'KeckFacility.get_observation_url()'

    def get_observing_sites(self):
        pass

    def get_terminal_observing_states(self):
        return super().get_terminal_observing_states()


    def validate_observation(self):
        """Perform a dry-run of submitting the observation."""
        pass

    def submit_observation(self, observation_payload):
        logger.debug(f'calling too.submit() with payload: {observation_payload}')
        # self.keck_api.too.submit()
        # logger.info(f'submit_observation - too.status.errors: {self.keck_api.too.status.errors}')

        # Generate a temporary observation ID for testing
        import time
        too_id = f"KECK_{int(time.time())}"
        logger.debug(f'Generated observation ID: {too_id}')

        return [too_id]

    def get_facility_context_data(self, **kwargs):
        """Allow the facility to add additional context data to the template.

        This method is called by `tom_observations.views.ObservationCreateView.get_context_data()`.
        """
        logger.debug(f'KeckFacility.get_facility_context_data kwargs: {kwargs}')
        facility_context_data = super().get_facility_context_data(**kwargs)

        keke_url = 'https://www3build.keck.hawaii.edu/sandbox/tcoda/observers/keke_dist/index.html'
        target_data = facility_context_data.get('target_data') 
        if target_data:
            keke_url += f'?target={target_data.get('name')}&ra={target_data.get('ra')}&dec={target_data.get('dec')}'


        logger.debug(f'KeckFacility.get_facility_context_data facility_context_data: {facility_context_data}')
        new_context_data = {
            'keke_url': keke_url,
        }

        facility_context_data.update(new_context_data)
        logger.debug(f'keck facility_context_data: {facility_context_data}')
        return facility_context_data