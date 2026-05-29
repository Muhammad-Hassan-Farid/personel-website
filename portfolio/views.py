from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.http import require_POST

from .forms import ContactForm
from .models import ContactMessage


def index(request):
    return render(request, 'portfolio/index.html')


@require_POST
def contact(request):
    form = ContactForm(request.POST)
    if form.is_valid():
        ContactMessage.objects.create(
            name=form.cleaned_data['name'],
            email=form.cleaned_data['email'],
            message=form.cleaned_data['message'],
        )
        return JsonResponse({'success': True})
    return JsonResponse({'success': False, 'errors': form.errors}, status=400)
