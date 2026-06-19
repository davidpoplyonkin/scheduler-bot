from fastapi import HTTPException


class AppException(HTTPException):
    """
    Custom exception with structured error hints.

    Args:
        status_code: HTTP status code
        detail: Error message
        non_critical: If True, frontend shows notification instead of error screen
        non_sensitive: If True, frontend displays the actual error message
    """

    def __init__(
        self,
        status_code: int,
        detail: str,
        non_critical: bool | None = None,
        non_sensitive: bool | None = None,
        headers: dict[str, str] | None = None,
    ):
        self.non_critical = non_critical
        self.non_sensitive = non_sensitive
        super().__init__(status_code=status_code, detail=detail, headers=headers)
