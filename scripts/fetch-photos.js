// TourAPI에서 각 장소의 실제 사진 URL 가져와서 data.js의 PHOTOS 자동 업데이트
// 사용법: node scripts/fetch-photos.js
// (한국관광공사_국문 관광정보 서비스 GW)

const fs = require('fs');
const path = require('path');

const TOUR_KEY = '1499b605ecb5e05540522bcec9f24edc1fa6b7d40eca680931f0b79c97b59607';
const DATA_PATH = path.join(__dirname, '..', 'js', 'data.js');

// 검색할 장소 목록 — data.js에서 추출
const PLACES = [
  // 기존 PHOTOS
  '꽃지해수욕장', '안면도자연휴양림', '백사장항', '방포항',
  '오마이갤러리', '대천해수욕장', '보령석탄박물관', '대천항수산시장',
  // Trip A 점심
  '서룡 보령', '김가네 사골수제비', '삼춘짬뽕 보령', '용화원 보령',
  '풍정불고기 보령', '토끼의수작 보령', '초밥짓는남자 보령',
  '로마의휴일 보령', '풍년국수 보령',
  // Trip A 놀거리
  '보령머드테마파크', '무창포해수욕장', '짚트랙코리아 대천',
  '바둑이네동물원 보령', '죽도상화원 보령', '천북굴단지',
  // Trip B 점심
  '꽃지해물칼국수', '파파스 안면도', '두꺼비짬뽕 안면도',
  '안면도맛집초밥', '김추일수제돈까스 안면도', '파스타포포 안면도',
  '일송꽃게장 안면도', '딴뚝통나무집 안면도',
  // Trip B 놀거리
  '안면도쥬라기박물관', '신두리해안사구', '태안빛축제',
  '천리포수목원', '만리포해수욕장',
  // 카페
  '카페하버무드 안면도', '카페아일 안면도', '나문재카페 안면도',
  // 해장
  '청주댁해장국집 안면도', '노순이뜨끈이집 서산', '양평해장국 홍성',
];

const ENDPOINT = 'https://apis.data.go.kr/B551011/KorService2/searchKeyword2';

async function searchOne(keyword) {
  const params = new URLSearchParams({
    serviceKey: TOUR_KEY,
    MobileOS: 'ETC',
    MobileApp: 'binload',
    keyword,
    numOfRows: '5',
    pageNo: '1',
    _type: 'json',
    arrange: 'O',  // 제목순 (대표이미지 우선 정렬은 'P')
  });
  const url = `${ENDPOINT}?${params.toString()}`;
  try {
    const r = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!r.ok) return { error: `HTTP ${r.status}` };
    const text = await r.text();
    if (text.startsWith('<')) {
      // OpenAPI 에러는 XML로 응답
      const errMatch = text.match(/<returnAuthMsg>([^<]+)/);
      return { error: errMatch ? errMatch[1] : 'XML error' };
    }
    const j = JSON.parse(text);
    const items = j?.response?.body?.items?.item || [];
    // firstimage 있는 첫 항목 우선
    const withImg = items.find(x => x.firstimage);
    if (withImg) return { title: withImg.title, image: withImg.firstimage, addr: withImg.addr1 };
    if (items[0]) return { title: items[0].title, image: '', addr: items[0].addr1, note: 'no image' };
    return { error: 'no results' };
  } catch (e) {
    return { error: e.message };
  }
}

async function main() {
  console.log(`[fetch-photos] ${PLACES.length}개 장소 검색 시작...`);
  const results = {};
  let okCount = 0, noImgCount = 0, errCount = 0;
  for (const place of PLACES) {
    process.stdout.write(`  - ${place} ... `);
    const r = await searchOne(place);
    results[place] = r;
    if (r.image) { okCount++; console.log(`✓ ${r.title}`); }
    else if (r.error) { errCount++; console.log(`✗ ${r.error}`); }
    else { noImgCount++; console.log(`· ${r.title} (이미지 없음)`); }
    await new Promise(r => setTimeout(r, 250));  // rate limit
  }

  // 결과 저장 (디버깅용)
  const logPath = path.join(__dirname, 'photo-results.json');
  fs.writeFileSync(logPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\n결과 로그: ${logPath}`);
  console.log(`성공: ${okCount} / 이미지없음: ${noImgCount} / 에러: ${errCount}`);

  // data.js의 PHOTOS object 생성
  const photosLines = [];
  for (const [place, r] of Object.entries(results)) {
    if (r.image) {
      // https로 정규화 (배포 페이지가 https일 때 mixed content 방지)
      const url = r.image.replace(/^http:/, 'https:');
      photosLines.push(`  ${JSON.stringify(place)}: '${url}',`);
    }
  }
  const photosBlock = `const PHOTOS = {\n${photosLines.join('\n')}\n};`;

  // data.js 읽고 PHOTOS 블록 교체
  let src = fs.readFileSync(DATA_PATH, 'utf8');
  const re = /const PHOTOS = \{[\s\S]*?\n\};/;
  if (!re.test(src)) {
    console.error('data.js에서 PHOTOS 블록을 찾지 못했습니다');
    process.exit(1);
  }
  src = src.replace(re, photosBlock);
  fs.writeFileSync(DATA_PATH, src, 'utf8');
  console.log(`data.js의 PHOTOS 블록 업데이트 완료 (${photosLines.length}개)`);
}

main().catch(e => { console.error(e); process.exit(1); });
