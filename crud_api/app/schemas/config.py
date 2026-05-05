from pydantic import ConfigDict
from pydantic.alias_generators import to_camel

config_dict = ConfigDict(
    # Automatically generates camelCase aliases for JSON
    alias_generator=to_camel,
    # Allows the model to be populated by the field name or the alias
    populate_by_name=True,
    # Ensures the JSON output uses the alias (camelCase)
    serialize_by_alias=True
)
