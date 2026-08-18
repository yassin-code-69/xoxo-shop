from decimal import ROUND_HALF_UP, Decimal


def to_decimal(val: str | float | Decimal, places: int = 2) -> Decimal:
    """Safely converts input into a Decimal with standard precision."""
    if isinstance(val, Decimal):
        dec = val
    else:
        dec = Decimal(str(val))
    return dec.quantize(Decimal(10) ** -places, rounding=ROUND_HALF_UP)


def format_bdt(amount: Decimal | str | float) -> str:
    """Formats amount as BDT string, e.g. '৳ 150.00'."""
    dec = to_decimal(amount)
    return f"৳ {dec:,.2f}"
