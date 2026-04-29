-- Remove legacy mock member placeholders from earlier prototype seed data.
-- Real roster rows are approved and may share names, so delete only unclaimed fake emails.

delete from public.members
where approved_at is null
  and auth_user_id is null
  and email in (
    'kim.doyun@postech.ac.kr',
    'lee.haneul@postech.ac.kr',
    'park.seojun@postech.ac.kr',
    'choi.yujin@postech.ac.kr',
    'jeong.minho@postech.ac.kr',
    'kim.taehyun@postech.ac.kr',
    'lee.subin@postech.ac.kr',
    'park.jiwoo@postech.ac.kr',
    'song.mina@postech.ac.kr',
    'han.junseo@postech.ac.kr',
    'oh.yerin.a@postech.ac.kr',
    'shin.donghoon@postech.ac.kr',
    'park.junhyuk.a@postech.ac.kr',
    'kim.minsu@alumni.postech.ac.kr',
    'lee.seoyeon@alumni.postech.ac.kr',
    'park.junhyuk.b@alumni.postech.ac.kr',
    'jeong.haeun@alumni.postech.ac.kr',
    'choi.youngmin@alumni.postech.ac.kr',
    'song.jiwon@alumni.postech.ac.kr',
    'han.seungwoo@alumni.postech.ac.kr',
    'park.seongju@alumni.postech.ac.kr',
    'kang.minji@alumni.postech.ac.kr',
    'lim.jaehyun@alumni.postech.ac.kr',
    'an.hongsang@alumni.postech.ac.kr',
    'bae.junhee@alumni.postech.ac.kr',
    'ryu.jihoon@alumni.postech.ac.kr',
    'hwang.sumin@alumni.postech.ac.kr'
  );
