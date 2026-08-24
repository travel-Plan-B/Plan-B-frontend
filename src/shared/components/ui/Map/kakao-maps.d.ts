/**
 * 카카오맵 JS SDK는 공식 타입 패키지가 없어서, 이 프로젝트에서 실제로 쓰는
 * 범위(지도/마커/커스텀 오버레이 생성, 클릭 이벤트)만 최소로 선언한다.
 * 새 API를 쓰게 되면 여기에 추가해야 한다.
 */
declare namespace kakao.maps {
  class LatLng {
    constructor(lat: number, lng: number);
  }

  class Size {
    constructor(width: number, height: number);
  }

  class Point {
    constructor(x: number, y: number);
  }

  interface MapOptions {
    center: LatLng;
    level?: number;
  }

  class Map {
    constructor(container: HTMLElement, options: MapOptions);
    setCenter(latlng: LatLng): void;
    setBounds(bounds: LatLngBounds): void;
    getLevel(): number;
    setLevel(level: number): void;
  }

  class LatLngBounds {
    extend(latlng: LatLng): void;
  }

  interface MarkerImageOptions {
    offset?: Point;
  }

  class MarkerImage {
    constructor(src: string, size: Size, options?: MarkerImageOptions);
  }

  interface MarkerOptions {
    position: LatLng;
    image?: MarkerImage;
    map?: Map;
    clickable?: boolean;
  }

  class Marker {
    constructor(options: MarkerOptions);
    setMap(map: Map | null): void;
    getPosition(): LatLng;
  }

  interface CustomOverlayOptions {
    position: LatLng;
    content: string | HTMLElement;
    map?: Map;
    yAnchor?: number;
    zIndex?: number;
  }

  class CustomOverlay {
    constructor(options: CustomOverlayOptions);
    setMap(map: Map | null): void;
  }

  interface PolylineOptions {
    path: LatLng[];
    strokeWeight?: number;
    strokeColor?: string;
    strokeOpacity?: number;
    strokeStyle?: string;
    endArrow?: boolean;
    map?: Map;
  }

  class Polyline {
    constructor(options: PolylineOptions);
    setMap(map: Map | null): void;
  }

  namespace event {
    function addListener(
      target: Marker | Map,
      type: string,
      handler: () => void,
    ): void;
  }

  namespace services {
    enum Status {
      OK = "OK",
      ZERO_RESULT = "ZERO_RESULT",
      ERROR = "ERROR",
    }

    interface AddressResult {
      address: {
        address_name: string;
      };
      road_address: {
        address_name: string;
      } | null;
    }

    class Geocoder {
      coord2Address(
        lng: number,
        lat: number,
        callback: (result: AddressResult[], status: Status) => void,
      ): void;
    }
  }

  function load(callback: () => void): void;
}

interface Window {
  kakao: typeof kakao;
}
