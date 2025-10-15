# Panasonic demo backend

---

## Install virtual env

```bash
pip3 install virtualenv
python3 -m venv <virtual-env-name>
source <virtual-env-name>/bin/activate
deactivate
```

## Install packages

```bash
pip3 install -r requirements.txt
```

## Run app

```bash
uvicorn app.main:app --reload --host localhost --port 5000
```
