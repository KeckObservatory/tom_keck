from django.shortcuts import render
from django.views.generic import TemplateView

# Create your views here.
class KekeView(TemplateView):
    template_name = 'keke_dist/index.html'

def keke(request):
    return render(request, 'tom_keck/keke.html')
