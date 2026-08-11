# Shared

특정 여행 도메인에 의존하지 않는 재사용 코드를 관리합니다.

공통 UI, hooks, API 기반 코드, utilities, constants, types가 실제로 필요해질 때 해당 하위 폴더를 추가합니다. 재사용 가능성만으로 코드를 옮기지 않고 실제 사용처가 생긴 뒤 공통화를 검토합니다.

`shared`는 `features`와 `app`을 import하지 않습니다.
