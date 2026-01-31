
import { Story, HistoryItem } from './types';

export const MOCK_STORIES: Story[] = [
  {
    id: '1',
    slug: 'loi-ru-cua-dai-duong',
    title: "Lời Ru Của Đại Dương",
    author: "Sarah Jenks",
    category: "Thư giãn",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDc_mcYdzqsj3dn8hO8mhjNCj3IRELnedoQremquihvFbVlWvs-bkOK2XIsPi-uxhGaaBckEsN2Uxduvo6cOkFypCwHpCA5aSDG5aRC6kb3p7nVk7eKV_zp3xkj04IQgziRU054j5JKj9QIseUXc4QglkMwnelJXYCcX2pY8QtFP69-qsQqAog-BWuKluecjTsKYK6dJ-1kCWnHFfqdFVUReAuSPSeff1qG8-iTn38msVC-Lzw5J1nK9Oahs8hLAJUFDtwDEoFNzsEP",
    description: "Trải nghiệm âm thanh êm dịu của biển sâu hòa quyện cùng câu chuyện khám phá đầy lôi cuốn.",
    tags: ["Thiên nhiên", "Ngủ ngon"],
    totalDuration: "2:45:00",
    rating: "4.9",
    reviewCount: "1.2k",
    releaseYear: "2023",
    chapters: [
      { id: 'c1', number: '01', title: 'Vào Lòng Biển Sâu', audioUrl: '#' }
    ]
  },
  {
    id: '2',
    slug: 'vat-ly-luong-tu-101',
    title: "Vật Lý Lượng Tử 101",
    author: "Tiến sĩ Aris",
    category: "Giáo dục",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBcpatF9p7bM_O667x-lZ_r0D2b1wHOlmIv3wgCQMXAlzS_r5CSbEpTFDZEmNXXZmOuPwEqxkM3GCFkuvyLHT6_BcjV9W2PriZEin_Qv36TQ48ne1hmkqPRiZGX_4__HKVa_pVDyIGT6j3T8iJl_VqgtV1fFPVFyXC7o-IEEctB3WKU7WVUuu_TEXrVuv_n5nN8fACTNWZNN_HdGWlmlvE_qTHeitZUD_0RvAodax8ibMSz5pTeVSBi8K1veuwUzREZWTfO8iHalOg3",
    description: "Giải mã những bí ẩn của vũ trụ qua lăng kính vật lý lượng tử.",
    /* Removed duplicate category property on line 30 */
    tags: ["Khoa học", "Vật lý"],
    totalDuration: "4:15:00",
    rating: "4.8",
    reviewCount: "850",
    releaseYear: "2024"
  },
  {
    id: '3',
    slug: 'mua-luc-nua-dem',
    title: "Mưa Lúc Nửa Đêm",
    author: "Lo-Fi Studio",
    category: "Ngủ ngon",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuD8dQECfgzamMwI9acOvxhpvnipJV0PDENF1huFehDAuZuhlftJOwQ65rdPgwElCiZ8KFn6NOUmC7E3QvfVjCuL1jA5IreoBVbnh88PHFoy5XUP70bJfXp0lRIIh2BdbKcBeS0h9JLibzTFFH2V2T2ke2kV1hTUWFEkGcS55b8hOb5k1MYNjseImHhK-vpaZvB295i1Nu7-jlIs22rz1Wr5hOReVQsKA3cKbml6YAg8JOgupn8s18mMa1UmiTWsmyKySChN1hYHSXCA",
    description: "Âm thanh mưa rơi tí tách giúp bạn thư giãn tuyệt đối.",
    tags: ["Relax", "ASMR"],
    totalDuration: "8:00:00",
    rating: "4.9"
  },
  {
    id: '6',
    slug: 'lich-su-la-ma',
    title: "Lịch Sử La Mã",
    author: "Giáo sư Marcus",
    category: "Lịch sử",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAYu-Bl-Tqv5oT_ZJ72EWji9f4ZfV6CvAv3LDHgkG7f5pTm7BKwkmCjvAxdNDrvtHsGGL4Cq6mt4xOxGp_Wuzrx1lE1yHRZMZWOg7hgbCBCugo6io-hyObjOKCflN0w6nYZn5BWdN5B6LiX4CmpqVSRoc7ztZvdjHnhnHNokVGJTXGdaI4FcrISCUWVqE8P00U5-Diyixk3CKrwiJvWAlQaQiJv26_wno1ZQ4L7YyErgyyprwUyYUpU6IwdvDjtgCziIlbx1Bk4hESf",
    description: "Hành trình trỗi dậy và sụp đổ của đế chế vĩ đại nhất nhân loại.",
    tags: ["Lịch sử", "Châu Âu"],
    totalDuration: "12:40:00",
    rating: "4.9",
    releaseYear: "2023"
  }
];

export const MOCK_HISTORY: HistoryItem[] = [
  {
    story: MOCK_STORIES[0],
    progress: 75,
    lastListened: "Hôm nay, 14:45",
    isCompleted: false
  },
  {
    story: MOCK_STORIES[1],
    progress: 32,
    lastListened: "Hôm qua, 21:15",
    isCompleted: false
  },
  {
    story: MOCK_STORIES[2],
    progress: 100,
    lastListened: "24 Th10, 2023",
    isCompleted: true
  },
  {
    story: MOCK_STORIES[3],
    progress: 15,
    lastListened: "20 Th10, 2023",
    isCompleted: false
  }
];
