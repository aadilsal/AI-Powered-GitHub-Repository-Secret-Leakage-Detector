import math
import re

# simple entropy implementation
def shannon_entropy(s: str) -> float:
    if not s:
        return 0.0
    # limit length to reasonable sample
    sample = s if len(s) <= 5000 else s[:5000]
    freq = {}
    for ch in sample:
        freq[ch] = freq.get(ch, 0) + 1
    entropy = 0.0
    length = len(sample)
    for count in freq.values():
        p = count / length
        entropy -= p * math.log2(p)
    return entropy

# regex flags used in training
AWS_ACCESS_KEY = re.compile(r"AKIA[0-9A-Z]{16}")
GITHUB_PAT = re.compile(r"ghp_[0-9A-Za-z_]{36,}")
JWT = re.compile(r"eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+")


def extract_features(text: str):
    # basic normalization
    s = text or ""
    length = len(s)
    unique_chars = len(set(s))
    char_diversity = unique_chars / (length if length > 0 else 1)

    digits = sum(c.isdigit() for c in s)
    uppers = sum(c.isupper() for c in s)
    lowers = sum(c.islower() for c in s)
    symbols = sum((not c.isalnum()) for c in s)

    digit_ratio = digits / length if length else 0.0
    upper_ratio = uppers / length if length else 0.0
    lower_ratio = lowers / length if length else 0.0
    symbol_ratio = symbols / length if length else 0.0

    entropy = shannon_entropy(s)

    aws_flag = 1 if AWS_ACCESS_KEY.search(s) else 0
    github_flag = 1 if GITHUB_PAT.search(s) else 0
    jwt_flag = 1 if JWT.search(s) else 0

    # Return feature list in the same order expected by the model
    features = [
        length,
        char_diversity,
        digit_ratio,
        upper_ratio,
        lower_ratio,
        symbol_ratio,
        entropy,
        aws_flag,
        github_flag,
        jwt_flag,
    ]

    return features
