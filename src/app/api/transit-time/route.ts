import { NextRequest, NextResponse } from "next/server";

/**
 * 오디세이(ODsay) 대중교통 길찾기를 서버사이드에서 대신 호출한다. ODSAY_API_KEY는
 * NEXT_PUBLIC_ 접두사가 없어 브라우저에 노출되지 않으니, 클라이언트는 이 라우트만
 * 호출하고 오디세이는 여기서만 부른다.
 */
export async function GET(request: NextRequest) {
  const apiKey = process.env.ODSAY_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ODSAY_API_KEY가 설정되지 않았습니다." },
      { status: 500 },
    );
  }

  const { searchParams } = request.nextUrl;
  const originLat = searchParams.get("originLat");
  const originLng = searchParams.get("originLng");
  const destLat = searchParams.get("destLat");
  const destLng = searchParams.get("destLng");

  if (!originLat || !originLng || !destLat || !destLng) {
    return NextResponse.json(
      { error: "originLat/originLng/destLat/destLng가 모두 필요합니다." },
      { status: 400 },
    );
  }

  const odsayUrl = new URL("https://api.odsay.com/v1/api/searchPubTransPathT");
  odsayUrl.searchParams.set("SX", originLng);
  odsayUrl.searchParams.set("SY", originLat);
  odsayUrl.searchParams.set("EX", destLng);
  odsayUrl.searchParams.set("EY", destLat);
  odsayUrl.searchParams.set("apiKey", apiKey);
  odsayUrl.searchParams.set("output", "json");

  try {
    const response = await fetch(odsayUrl);
    const data = await response.json();

    // 경로를 못 찾으면 result 대신 error 필드로 온다(오디세이 스펙).
    const totalTime: number | undefined =
      data?.result?.path?.[0]?.info?.totalTime;
    return NextResponse.json({ minutes: totalTime ?? null });
  } catch {
    return NextResponse.json({ minutes: null });
  }
}
