import gettext
import datetime
from pathlib import Path
from models import Service

from babel.dates import format_date as babel_format_date

LOCALES_DIR = Path(__file__).parent.parent / "locales"
SUPPORTED_LANGS = ("en", "ru", "uk")
LANG_TO_LOCALE = {
    "en": "en_US",
    "ru": "ru_RU",
    "uk": "uk_UA",
}


def get_translator(lang: str | None) -> gettext.GNUTranslations | gettext.NullTranslations:
    lang = lang if lang in SUPPORTED_LANGS else "en"
    try:
        return gettext.translation("messages", LOCALES_DIR, languages=[lang])
    except FileNotFoundError:
        return gettext.NullTranslations()


def t(key: str, lang: str | None) -> str:
    translator = get_translator(lang)
    return translator.gettext(key)


MARKDOWNV2_RESERVED = r"_*[]()~`>#+-=|{}.!"


def escape_markdownv2(text: str) -> str:
    return "".join(f"\\{c}" if c in MARKDOWNV2_RESERVED else c for c in text)


def format_date(date: datetime.date, lang: str | None) -> str:
    lang = lang if lang in SUPPORTED_LANGS else "en"
    locale = LANG_TO_LOCALE.get(lang, "en_US")
    return babel_format_date(date, format="EEE, MMM d", locale=locale)


def get_service_name(service: Service, lang: str | None) -> str:
    """Get service name in the requested language with English fallback."""
    translations = {tr.language_code: tr.name for tr in service.translations}
    return translations.get(lang) or translations.get("en") or f"Service {service.id}"
