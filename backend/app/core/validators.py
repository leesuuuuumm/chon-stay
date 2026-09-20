import dns.resolver

def domain_has_mx_record(email: str) -> bool:
    """이메일 도메인이 실제로 메일을 받을 수 있는지 DNS로 확인"""
    try:
        domain = email.split("@")[1]
        dns.resolver.resolve(domain,"MX")
        return True
    except Exception:
        return False