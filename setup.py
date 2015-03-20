from setuptools import setup

setup(
    name='Pazzla',
    version='1.0',
    long_description=__doc__,
    author='Petr Devaikin',
    author_email='p.devaikin@gmail.com',
    include_package_data=True,
    zip_safe=False,
    setup_requires=['Flask'],
    install_requires=['Flask', 'Flask-Script', 'peewee', 'Flask-Scss', 'python-instagram', 'Pillow']
)
