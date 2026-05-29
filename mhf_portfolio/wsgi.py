import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mhf_portfolio.settings')
django.setup()

# On Vercel the DB lives in /tmp and is wiped on cold start — migrate every time.
if os.environ.get('VERCEL'):
    from django.core.management import call_command
    try:
        call_command('migrate', '--run-syncdb', verbosity=0)
    except Exception:
        pass

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
