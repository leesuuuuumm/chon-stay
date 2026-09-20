import enum

class DurationOfStay(str, enum.Enum):
    DAY = "DAY"
    ONE_NIGHT_TWO_DAYS = "ONE_NIGHT_TWO_DAYS"
    MONTH = "MONTH"

class InterestCode(str, enum.Enum):
    FARMING = "FARMING"      # 농사체험
    CRAFT = "CRAFT"          # 공방·수공예
    HEALING = "HEALING"      # 휴양·힐링
    NATURE = "NATURE"        # 자연체험

