# API 명세

백엔드 API 요구사항 정의서를 마크다운으로 정리한 문서. 프론트 개발/목업(MSW) 시 이 문서를 기준으로 삼는다.

- 담당자: 순현오
- 완료상태는 **백엔드 구현 기준**이다 (프론트 연동 여부와 무관).
- "구분"이 **외부 연동**인 API는 백엔드가 호출하는 API라 프론트에서 직접 쓰지 않는다 (참고용).

## 프론트 연동 대상 정리

외부 연동 API(`REQ-EXT-*`)는 백엔드 전용이라 제외하고, "우리 서버" API 7개를 화면/기능 기준으로 정리한다. 백엔드는 챗봇을 제외하고 모두 구현 완료된 상태라, 아래 우선순위는 이제 **프론트 화면/기능 준비 상태**를 기준으로 판단한다.

| 우선순위 | 요구사항 ID       | 백엔드 상태 | 사용 화면/기능                                                                          | 프론트 연동 필요도 | 비고                                                                            |
| -------- | ----------------- | ----------- | --------------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------- |
| 1        | `REQ-DETAIL-001`  | 완료        | 디테일모드 1단계 `장소 찾기` 탭 검색 (`PlaceFinderPanel`)                               | 높음               | 화면(#53)이 이미 퍼블리싱돼 있어 바로 연동 가능. 다음 이슈 1순위                |
| 2        | `REQ-WEATHER-001` | 완료        | 디테일모드 여행 일정 입력의 DAY 탭 온도 표시 ("DAY1 22℃")                               | 중간               | 채워진 상태 화면(Figma)에 노출되는 값. 채워진 상태 이슈와 함께 진행             |
| 3        | `REQ-DETAIL-003`  | 완료        | 여행 일정 타임라인 드래그앤드롭 시 시간 충돌 검증                                       | 중간               | 드래그앤드롭 기능(별도 이슈) 붙을 때 함께 연동                                  |
| 4        | `REQ-DETAIL-002`  | 완료        | 디테일모드 2~3단계(조건 설정/결과편집), 복구 사유(`RecoveryTypeCard`) 선택 후 추천 흐름 | 중간               | 2~3단계 화면 자체가 아직 없어서 화면 작업과 함께 진행                           |
| 5        | `REQ-SIMPLE-001`  | 완료        | 간편모드 복구 (`/recovery/simple`)                                                      | 중간               | `SimpleRecoveryReasonPage`는 있지만 추천 결과 화면은 아직 없음 (별도 이슈 트랙) |
| 6        | `REQ-CHATBOT-001` | 진행중      | 챗봇 대체 장소 추천                                                                     | 낮음               | 백엔드도 아직 진행 중, 화면 설계도 전이라 대기                                  |
| 7        | `REQ-COMMON-001`  | 완료        | 없음 (헬스체크)                                                                         | 낮음               | 배포/인프라 점검용, 화면 연동 아님                                              |

## 목차

- [우리 서버 API (프론트 대상)](#우리-서버-api-프론트-대상)
  - [REQ-COMMON-001 서버 상태 확인](#req-common-001-서버-상태-확인)
  - [REQ-SIMPLE-001 심플탭 추천 요청](#req-simple-001-심플탭-추천-요청)
  - [REQ-DETAIL-001 디테일탭 장소 검색](#req-detail-001-디테일탭-장소-검색담아둔-장소)
  - [REQ-DETAIL-002 디테일탭 항목별 추천 요청](#req-detail-002-디테일탭-항목별-추천-요청)
  - [REQ-DETAIL-003 디테일탭 시간 변경 충돌 검증](#req-detail-003-디테일탭-시간-변경-충돌-검증)
  - [REQ-WEATHER-001 현재 위치 날씨 조회](#req-weather-001-현재-위치-날씨-조회-프론트-표시용)
  - [REQ-CHATBOT-001 챗봇 대체 장소 추천](#req-chatbot-001-챗봇---자연어-대화로-대체-장소-추천)
- [외부 연동 API (백엔드가 호출, 참고용)](#외부-연동-api-백엔드가-호출-참고용)
  - [REQ-EXT-001 기상청 단기예보 조회](#req-ext-001-기상청-단기예보-조회)
  - [REQ-EXT-002 TourAPI 위치기반 관광정보 조회](#req-ext-002-tourapi-위치기반-관광정보-조회)
  - [REQ-EXT-003 Google Places Nearby Search](#req-ext-003-google-places-nearby-search)
  - [REQ-EXT-004 카카오 Local API 키워드 장소 검색](#req-ext-004-카카오-local-api-키워드-장소-검색)
  - [REQ-EXT-005 카카오모빌리티 자동차 길찾기](#req-ext-005-카카오모빌리티-자동차-길찾기)

---

## 우리 서버 API (프론트 대상)

### REQ-COMMON-001 서버 상태 확인

- **URL**: `GET /health` (실제 배포 서버 기준. `/api/v1` prefix 없음)
- **백엔드 완료상태**: 완료

**Response**

```json
{ "status": "str" }
```

예시:

```json
{ "status": "ok" }
```

---

### REQ-SIMPLE-001 심플탭 추천 요청

- **URL**: `POST /api/v1/simple/recommendations`
- **백엔드 완료상태**: 완료

**Request Body**

```json
{
  "current_location": { "lat": 0, "lng": 0 },
  "next_place": { "...": "..." },
  "deadline_time": "str",
  "current_time": "str",
  "transport": "WALK | CAR",
  "problem_reason": "WEATHER | PLACE_UNAVAILABLE | TIME_CHANGED",
  "situational_answer": "str",
  "sort": "RECOMMENDED | NEAREST | LONGEST_STAY"
}
```

- `next_place`는 없으면 `null`

예시:

```json
{
  "current_location": { "lat": 37.5219, "lng": 129.1145 },
  "deadline_time": "18:00",
  "current_time": "13:30",
  "transport": "CAR",
  "problem_reason": "WEATHER",
  "situational_answer": "BOTH",
  "sort": "RECOMMENDED"
}
```

**Response — Success**

```json
{
  "available_minutes": 0,
  "ai_recommended": [
    {
      "place_id": "str",
      "name": "str",
      "category_tag": "str",
      "is_indoor": true,
      "image_url": "str",
      "rating": 0,
      "user_rating_count": 0,
      "description": "str",
      "location": { "lat": 0, "lng": 0 },
      "travel_time_minutes": 0,
      "operating_hours": "str",
      "parking_available": true,
      "address": "str",
      "estimated_duration_minutes": 0,
      "recommend_reason": "str"
    }
  ],
  "more_places": [
    { "...": "ai_recommended와 동일 필드, recommend_reason 없음" }
  ]
}
```

- `ai_recommended`: AI가 선택한 추천 (최대 3개, `recommend_reason` 포함)
- `more_places`: 나머지 후보 (최대 7개, `recommend_reason` 없음)

예시:

```json
{
  "available_minutes": 87,
  "ai_recommended": [
    {
      "name": "강릉시립미술관",
      "rating": 4.4,
      "recommend_reason": "비가 와서 실내 장소 중 이동시간이 가장 짧아요"
    }
  ],
  "more_places": [{ "name": "오죽헌", "rating": 4.6 }]
}
```

**Response — Error**

| 상황            | 코드                                                                        |
| --------------- | --------------------------------------------------------------------------- |
| 필드 검증 실패  | `400 VALIDATION_ERROR` (`field`로 어떤 필드인지 표기)                       |
| 후보 없음       | `200`, `ai_recommended`/`more_places` 모두 빈 배열 + `no_candidates_reason` |
| AI 호출 실패 등 | `503 EXTERNAL_API_UNAVAILABLE`                                              |

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "field": "deadline_time",
    "message": "deadline_time 형식 오류"
  }
}
```

---

### REQ-DETAIL-001 디테일탭 장소 검색(담아둔 장소)

- **URL**: `GET /api/v1/places/search`
- **백엔드 완료상태**: 완료

**Query Parameter**

```json
{ "query": "str" }
```

예시: `?query=경포해변`

**Response — Success**

실제 배포 서버 응답 기준(2026-08-21 확인). OpenAPI 스펙에는 응답 스키마가 비어 있어(`response_model` 미지정) 문서화되지 않았던 것을 실제 호출로 채워 넣었다. `place_id` 단일 필드는 없고 `source`+`source_id` 조합이 유일 키다(REQ-DETAIL-002 참고). `location` 중첩 객체가 아니라 `lat`/`lng`이 최상위 필드다.

```json
{
  "count": 0,
  "places": [
    {
      "source": "str",
      "source_id": "str",
      "name": "str",
      "address": "str",
      "category_tag": "str",
      "is_indoor": true,
      "lat": 0,
      "lng": 0,
      "image_url": "str | null",
      "description": "str | null",
      "rating": 0,
      "user_rating_count": 0,
      "operating_hours": "str | null",
      "parking_available": true,
      "raw_category_source": "str"
    }
  ]
}
```

예시 (`?query=경포해변`):

```json
{
  "count": 8,
  "places": [
    {
      "source": "kakao",
      "source_id": "8199114",
      "name": "경포해수욕장",
      "address": "강원특별자치도 강릉시 창해로 514",
      "category_tag": "관광지",
      "is_indoor": null,
      "lat": 37.8034055083125,
      "lng": 128.910210247605,
      "image_url": null,
      "description": null,
      "rating": null,
      "user_rating_count": null,
      "operating_hours": null,
      "parking_available": null,
      "raw_category_source": "AT4"
    }
  ]
}
```

- `rating`, `user_rating_count`, `image_url` 등은 데이터가 없으면 `null`로 내려온다. 프론트에서 null 처리 필요.

**Response — Error**

`400 VALIDATION_ERROR` (`field`로 어떤 필드인지 표기)

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "field": "query",
    "message": "query 필수"
  }
}
```

---

### REQ-DETAIL-002 디테일탭 항목별 추천 요청

- **URL**: `POST /api/v1/detail/recommendations`
- **백엔드 완료상태**: 완료

**Request Body**

```json
{
  "item_id": "str",
  "place_id": "str",
  "source": "tourapi | google | kakao",
  "prev_item_location": { "lat": 0, "lng": 0 },
  "next_item_location": { "lat": 0, "lng": 0 },
  "next_item_start_time": "HH:MM",
  "current_time": "HH:MM",
  "priority": "MINIMIZE_TRAVEL | SIMILAR_TO_ORIGINAL | EXPLORE_NEW",
  "transport": "WALK | CAR",
  "problem_reason": "WEATHER | PLACE_UNAVAILABLE | TIME_CHANGED",
  "situational_answer": "str"
}
```

- `place_id`는 Place 테이블 조회용 — `source`와 조합해야 유일한 키가 됨
- `prev_item_location`/`next_item_location`/`next_item_start_time`/`current_time`/`situational_answer`는 없으면 `null`

예시:

```json
{
  "item_id": "item-001",
  "place_id": "8199114",
  "source": "kakao",
  "prev_item_location": { "lat": 37.8034, "lng": 128.9102 },
  "next_item_location": { "lat": 37.8172, "lng": 128.8976 },
  "next_item_start_time": "18:00",
  "current_time": "16:30",
  "priority": "MINIMIZE_TRAVEL",
  "transport": "CAR",
  "problem_reason": "PLACE_UNAVAILABLE",
  "situational_answer": "YES"
}
```

**Response — Success**

```json
{
  "ai_recommended": [
    {
      "place_id": "str",
      "name": "str",
      "address": "str",
      "category_tag": "str",
      "is_indoor": true,
      "rating": 0,
      "user_rating_count": 0,
      "parking_status": "FREE | PAID | null",
      "travel_time_from_prev_minutes": 0,
      "travel_time_to_next_minutes": 0,
      "estimated_duration_minutes": 0,
      "schedule_buffer_minutes": 0,
      "recommend_reason": "str"
    }
  ],
  "more_places": [
    { "...": "ai_recommended와 동일 필드, recommend_reason 없음" }
  ]
}
```

예시:

```json
{
  "item_id": "item-001",
  "ai_recommended": [
    {
      "name": "경포호수광장",
      "rating": 4.6,
      "is_indoor": true,
      "parking_status": null,
      "travel_time_from_prev_minutes": 3,
      "schedule_buffer_minutes": 42,
      "recommend_reason": "비 오는 날에도 실내 관람 가능한 대표 명소예요"
    }
  ]
}
```

**Response — Error**

| 상황           | 코드                                                  |
| -------------- | ----------------------------------------------------- |
| 필드 검증 실패 | `400 VALIDATION_ERROR` (`field`로 어떤 필드인지 표기) |
| 후보 없음      | `200 NO_CANDIDATES_FOUND`                             |

```json
{
  "item_id": "item-001",
  "ai_recommended": [],
  "more_places": [],
  "no_candidates_reason": "NO_SUITABLE_PLACE"
}
```

---

### REQ-DETAIL-003 디테일탭 시간 변경 충돌 검증

- **URL**: `POST /api/v1/schedule/validate`
- **백엔드 완료상태**: 완료

**Request Body**

```json
{
  "item_id": "str",
  "new_start_time": "str",
  "new_duration_minutes": 0,
  "location": { "lat": 0, "lng": 0 },
  "next_fixed_item": {
    "start_time": "str",
    "location": { "lat": 0, "lng": 0 }
  },
  "transport": "WALK | CAR"
}
```

예시:

```json
{
  "item_id": "item-002",
  "new_start_time": "15:00",
  "new_duration_minutes": 90,
  "next_fixed_item": { "start_time": "18:00" }
}
```

**Response — Success**

```json
{
  "valid": true,
  "buffer_minutes_remaining": 0,
  "reason": "str | null",
  "shortfall_minutes": 0
}
```

예시:

```json
{
  "valid": false,
  "reason": "다음 고정 일정(18:00) 도착까지 시간이 부족합니다.",
  "shortfall_minutes": 8
}
```

**Response — Error**

`400 VALIDATION_ERROR` (`field`로 어떤 필드인지 표기)

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "field": "new_start_time",
    "message": "new_start_time 형식 오류"
  }
}
```

---

### REQ-WEATHER-001 현재 위치 날씨 조회 (프론트 표시용)

- **URL**: `GET /api/v1/weather`
- **백엔드 완료상태**: 완료

**Query Parameter**

```json
{ "lat": 0.0, "lng": 0.0 }
```

예시: `?lat=36.4480&lng=126.7994`

**Response — Success**

```json
{
  "temperature": 0.0,
  "humidity": 0,
  "wind_speed": 0.0,
  "precipitation_probability": 0,
  "sky_condition": "CLEAR | PARTLY_CLOUDY | CLOUDY | RAIN | RAIN_SNOW | SNOW | SHOWER",
  "forecast_time": "HHMM"
}
```

예시:

```json
{
  "success": true,
  "data": {
    "temperature": 25.0,
    "humidity": 90,
    "wind_speed": 1.9,
    "precipitation_probability": 0,
    "sky_condition": "CLEAR",
    "forecast_time": "1800"
  }
}
```

**Response — Error**

조회 실패 시 `200 WEATHER_UNAVAILABLE`

```json
{
  "success": false,
  "error": {
    "code": "WEATHER_UNAVAILABLE",
    "message": "날씨 정보를 가져올 수 없습니다."
  }
}
```

---

### REQ-CHATBOT-001 챗봇 - 자연어 대화로 대체 장소 추천

- **URL**: `POST /api/v1/chat`
- **백엔드 완료상태**: 진행중

**Request Body**

```json
{
  "session_id": "str | null",
  "message": "str"
}
```

- `session_id`가 없으면 새 세션 생성

예시:

```json
{
  "session_id": null,
  "message": "청양 문화예술회관 갈려는데 휴일이라 못가"
}
```

**Response — Success**

응답 `type`에 따라 형태가 다르다.

- `QUESTION`: 정보가 더 필요할 때 되묻는 응답
  ```json
  { "session_id": "str", "type": "QUESTION", "message": "str" }
  ```
- `READY`: 이전 단계 응답 없음 — 바로 `RECOMMENDATION`으로 이어짐
- `RECOMMENDATION`: 최종 추천
  ```json
  {
    "session_id": "str",
    "type": "RECOMMENDATION",
    "data": {
      "ai_recommended": [
        { "...": "place item, 최대 3개, recommend_reason 포함" }
      ],
      "more_places": [{ "...": "place item" }]
    }
  }
  ```

예시 (QUESTION):

```json
{
  "session_id": "6bacc673-c144-4471-a106-139989cfd5ee",
  "type": "QUESTION",
  "message": "지금 어디에 계신가요?"
}
```

예시 (RECOMMENDATION):

```json
{
  "session_id": "6bacc673-c144-4471-a106-139989cfd5ee",
  "type": "RECOMMENDATION",
  "data": {
    "ai_recommended": [
      {
        "place_id": "2850475",
        "name": "한옥카페 지은",
        "category_tag": "카페",
        "rating": 4.6,
        "recommend_reason": ["...", "..."]
      }
    ],
    "more_places": []
  }
}
```

**Response — Error**

- 정보 처리 실패 시 `200`, `{ "type": "ERROR", "message": "str" }`
- 사유: `PLACE_NOT_FOUND` / `LOCATION_NOT_FOUND` / `CATEGORY_NOT_SUPPORTED`
- 세션은 30분 미사용 시 만료되며, 만료 시 자동으로 새 세션이 생성된다.

```json
{
  "session_id": "...",
  "type": "ERROR",
  "message": "말씀하신 장소를 찾지 못했어요. 정확한 이름을 다시 알려주시겠어요?"
}
```

---

## 외부 연동 API (백엔드가 호출, 참고용)

아래 API들은 백엔드가 직접 호출하는 외부 API로, 프론트에서 직접 연동하지 않는다. 백엔드 응답 형태를 이해하기 위한 참고용.

### REQ-EXT-001 기상청 단기예보 조회

- **URL**: `GET apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst`
- **백엔드 완료상태**: 예정

**Query Parameter**

```json
{
  "serviceKey": "str",
  "numOfRows": 0,
  "pageNo": 0,
  "dataType": "str",
  "base_date": "str",
  "base_time": "str",
  "nx": 0,
  "ny": 0
}
```

예시: `?serviceKey=...&dataType=JSON&base_date=20260725&base_time=1300&nx=90&ny=100`

**Response — Success**

```json
{
  "response": {
    "body": {
      "items": {
        "item": [
          {
            "category": "PTY | WSD | ...",
            "fcstValue": "str",
            "fcstDate": "str",
            "fcstTime": "str"
          }
        ]
      }
    }
  }
}
```

예시:

```json
{
  "response": {
    "body": {
      "items": {
        "item": [
          { "category": "PTY", "fcstValue": "1" },
          { "category": "WSD", "fcstValue": "3.2" }
        ]
      }
    }
  }
}
```

**Response — Error**

공공데이터포털 공통 에러 (예: `SERVICE_KEY_IS_NOT_REGISTERED_ERROR`)

```json
{ "resultCode": "30", "resultMsg": "SERVICE_KEY_IS_NOT_REGISTERED_ERROR" }
```

---

### REQ-EXT-002 TourAPI 위치기반 관광정보 조회

- **URL**: `GET apis.data.go.kr/B551011/KorService2/locationBasedList2`
- **백엔드 완료상태**: 예정

**Query Parameter**

```json
{
  "serviceKey": "str",
  "MobileOS": "str",
  "MobileApp": "str",
  "mapX": 0,
  "mapY": 0,
  "radius": 0,
  "contentTypeId": 0,
  "numOfRows": 0,
  "pageNo": 0
}
```

예시: `?mapX=127.095&mapY=37.822&radius=1000&contentTypeId=12`

**Response — Success**

```json
{
  "response": {
    "body": {
      "items": {
        "item": [
          {
            "title": "str",
            "addr1": "str",
            "mapx": "str",
            "mapy": "str",
            "firstimage": "str",
            "contenttypeid": "str",
            "cat1": "str",
            "cat2": "str",
            "cat3": "str"
          }
        ]
      }
    }
  }
}
```

예시:

```json
{
  "response": {
    "body": {
      "items": {
        "item": [
          {
            "title": "강릉시립미술관",
            "mapx": "128.87",
            "mapy": "37.75",
            "contenttypeid": "14"
          }
        ]
      }
    }
  }
}
```

**Response — Error**

공공데이터포털 공통 에러

```json
{ "resultCode": "30", "resultMsg": "SERVICE_KEY_IS_NOT_REGISTERED_ERROR" }
```

---

### REQ-EXT-003 Google Places Nearby Search

- **URL**: `POST places.googleapis.com/v1/places:searchNearby`
- **백엔드 완료상태**: 예정

**Header**

```json
{ "X-Goog-Api-Key": "str", "X-Goog-FieldMask": "str" }
```

예시: `X-Goog-FieldMask: places.displayName,places.rating,places.userRatingCount,places.location,places.types`

**Request Body**

```json
{
  "locationRestriction": {
    "circle": { "center": { "lat": 0, "lng": 0 }, "radius": 0.0 }
  },
  "maxResultCount": 0,
  "languageCode": "str"
}
```

예시:

```json
{
  "locationRestriction": {
    "circle": {
      "center": { "latitude": 37.5219, "longitude": 129.1145 },
      "radius": 1000.0
    }
  },
  "maxResultCount": 10,
  "languageCode": "ko"
}
```

**Response — Success**

```json
{
  "places": [
    {
      "displayName": { "text": "str" },
      "rating": 0,
      "userRatingCount": 0,
      "location": { "lat": 0, "lng": 0 },
      "types": ["str"]
    }
  ]
}
```

예시:

```json
{
  "places": [
    {
      "displayName": { "text": "천곡황금박쥐동굴" },
      "rating": 4.3,
      "userRatingCount": 2660,
      "types": ["tourist_attraction"]
    }
  ]
}
```

**Response — Error**

`400 INVALID_ARGUMENT`(예: `API_KEY_INVALID`), `403 PERMISSION_DENIED`

```json
{
  "error": {
    "code": 400,
    "message": "API key not valid.",
    "status": "INVALID_ARGUMENT"
  }
}
```

---

### REQ-EXT-004 카카오 Local API 키워드 장소 검색

- **URL**: `GET dapi.kakao.com/v2/local/search/keyword.json`
- **백엔드 완료상태**: 예정
- 디테일탭에서 담아둔 장소를 검색할 때 사용

**Header**

```json
{ "Authorization": "KakaoAK {REST_API_KEY}" }
```

예시: `Authorization: KakaoAK abcd1234...`

**Query Parameter**

```json
{
  "query": "str",
  "x": "str",
  "y": "str",
  "radius": 0,
  "category_group_code": "str"
}
```

예시: `?query=경포해변`

**Response — Success**

```json
{
  "documents": [
    {
      "place_name": "str",
      "address_name": "str",
      "x": "str",
      "y": "str",
      "category_name": "str",
      "category_group_code": "str"
    }
  ],
  "meta": { "...": "..." }
}
```

예시:

```json
{
  "documents": [
    {
      "place_name": "경포해변",
      "x": "128.898",
      "y": "37.805",
      "category_name": "여행 > 관광,명소 > 해수욕장"
    }
  ]
}
```

**Response — Error**

`401` 인증 실패, `429` 쿼터 초과

```json
{ "errorType": "AccessDeniedException", "message": "invalid api key" }
```

---

### REQ-EXT-005 카카오모빌리티 자동차 길찾기

- **URL**: `GET apis-navi.kakaomobility.com/v1/directions`
- **백엔드 완료상태**: 예정
- 이동시간·거리 조회용. 실제 호출 테스트 완료, 기존 REST API 키로 정상 동작 확인됨.

**Header**

```json
{ "Authorization": "KakaoAK {REST_API_KEY}" }
```

예시: `Authorization: KakaoAK abcd1234...`

**Query Parameter**

```json
{ "origin": "x,y", "destination": "x,y", "priority": "str" }
```

예시: `?origin=129.1145,37.5219&destination=129.1223,37.5199&priority=RECOMMEND`

**Response — Success**

```json
{
  "routes": [
    {
      "summary": {
        "duration": 0,
        "distance": 0,
        "fare": { "taxi": 0, "toll": 0 }
      }
    }
  ]
}
```

- `duration`: 초 단위, `distance`: 미터 단위

예시:

```json
{
  "routes": [
    {
      "summary": {
        "duration": 410,
        "distance": 2259,
        "fare": { "taxi": 5300, "toll": 0 }
      }
    }
  ]
}
```

**Response — Error**

`401`/`403` 인증 실패, 결과 코드 `result_code != 0`이면 경로 탐색 실패

```json
{ "routes": [{ "result_code": 1, "result_msg": "길찾기 실패" }] }
```
