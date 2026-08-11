# Contributing

Thank you for your interest in contributing to Secure Cloud Storage! As this is a personal project, the scope is currently small, but suggestions and bug fixes are welcome.

## Local Development

### Backend (Python/FastAPI)
```bash
cd server
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt pytest
```

To run tests:
```bash
pytest -c pytest.ini server/
```

### Web Client (React)
```bash
cd web_client
npm install
npm run dev
```

### Mobile Client (Flutter)
```bash
cd mobile_client
flutter pub get
flutter run
flutter test
```

## Pull Requests

1. Fork the repository and create your branch from `main`.
2. Ensure you have tested your changes locally.
3. Write clear and descriptive commit messages.
4. Ensure the test suites pass.
5. Create a Pull Request summarizing your changes.

Since this is a personal project, please understand if large sweeping feature additions are declined. Bug fixes, security improvements, and cleanups are highly appreciated.
