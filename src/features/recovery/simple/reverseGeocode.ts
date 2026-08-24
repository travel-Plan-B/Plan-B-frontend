import { loadKakaoMapsSdk } from "@/shared/components/ui/Map/useKakaoMapsScript";

export async function reverseGeocodeCoordinates(
  lat: number,
  lng: number,
): Promise<string> {
  await loadKakaoMapsSdk();

  return new Promise((resolve, reject) => {
    const geocoder = new window.kakao.maps.services.Geocoder();

    geocoder.coord2Address(lng, lat, (result, status) => {
      if (status !== window.kakao.maps.services.Status.OK || !result[0]) {
        reject(new Error("현재 좌표의 주소를 찾지 못했습니다."));
        return;
      }

      const address =
        result[0].road_address?.address_name ?? result[0].address.address_name;
      resolve(address);
    });
  });
}
