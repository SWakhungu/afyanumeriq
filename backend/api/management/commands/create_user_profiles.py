from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import UserProfile


class Command(BaseCommand):
    help = 'Create UserProfile for all users that dont have one'

    def handle(self, *args, **options):
        for user in User.objects.all():
            profile, created = UserProfile.objects.get_or_create(
                user=user,
                defaults={'role': 'staff'}
            )
            if created:
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Created profile for user: {user.username}'
                    )
                )
            else:
                self.stdout.write(
                    f'Profile already exists for user: {user.username}'
                )
