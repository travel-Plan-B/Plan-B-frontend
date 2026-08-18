# Features

사용자 기능과 도메인별 UI, hooks, API, schema, types, store를 관리합니다.

기능 코드가 처음 생길 때 `recovery`, `recommendation` 같은 기능 폴더를 추가합니다. 필요한 코드가 없는 하위 폴더는 미리 만들지 않습니다.

Feature는 `shared`를 import할 수 있지만 `app`을 import하지 않습니다. Feature 간 직접 import는 피하고 페이지에서 조합합니다.
