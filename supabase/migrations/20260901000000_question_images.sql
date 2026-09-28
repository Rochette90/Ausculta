begin;

-- ---------------------------------------------------------------------------
-- 1. Support d'image optionnelle sur les questions (ECG, radios, photos de
--    lésions cutanées, coupes scanner/IRM) : deux colonnes nullables, suivant
--    la convention `*_url` déjà utilisée par `profiles.avatar_url`.
-- ---------------------------------------------------------------------------
alter table public.questions
  add column if not exists image_url text,
  add column if not exists image_alt text;

-- ---------------------------------------------------------------------------
-- 2. `admin_upsert_question` étendue avec l'image (url + texte alternatif).
-- ---------------------------------------------------------------------------
create or replace function public.admin_upsert_question(
  p_admin_user_id uuid,
  p_question_id uuid,
  p_specialty_id uuid,
  p_pathology_id uuid,
  p_question_text text,
  p_clinical_vignette text,
  p_learning_objective text,
  p_explanation text,
  p_difficulty text,
  p_xp_reward integer,
  p_question_type text,
  p_review_status text,
  p_is_published boolean,
  p_exam_domain text,
  p_source_title text,
  p_source_url text,
  p_source_year integer,
  p_estimated_seconds integer,
  p_topic_ids uuid[],
  p_options jsonb,
  p_image_url text default null,
  p_image_alt text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_question_id uuid;
  v_version integer;
  v_option jsonb;
  v_option_count integer;
  v_correct_count integer;
  v_publish boolean := p_is_published and p_review_status = 'approved';
  v_old_snapshot jsonb;
begin
  if not exists(select 1 from public.profiles where id = p_admin_user_id and role = 'admin') then
    raise exception 'admin access required';
  end if;
  if not exists(select 1 from public.specialties where id = p_specialty_id) then
    raise exception 'specialty not found';
  end if;
  if p_pathology_id is not null and not exists(
    select 1 from public.pathologies where id = p_pathology_id and specialty_id = p_specialty_id
  ) then raise exception 'pathology specialty mismatch'; end if;

  if jsonb_typeof(coalesce(p_options, '[]'::jsonb)) <> 'array' then
    raise exception 'invalid options payload';
  end if;
  v_option_count := jsonb_array_length(coalesce(p_options, '[]'::jsonb));
  select count(*) into v_correct_count
  from jsonb_array_elements(coalesce(p_options, '[]'::jsonb)) option_row
  where coalesce((option_row->>'isCorrect')::boolean, false);

  if char_length(trim(p_question_text)) not between 10 and 5000
    or char_length(coalesce(p_explanation, '')) > 10000
    or p_difficulty not in ('facile', 'moyen', 'difficile')
    or p_xp_reward not between 0 and 100
    or p_question_type not in ('single_best_answer', 'multiple_choice', 'long_menu')
    or p_review_status not in ('draft', 'in_review', 'approved', 'rejected')
    or p_estimated_seconds not between 15 and 900
    or (p_source_year is not null and p_source_year not between 1900 and 2100)
    or (p_image_url is not null and (char_length(p_image_url) > 2048 or p_image_url !~ '^https?://'))
    or (p_image_alt is not null and char_length(p_image_alt) > 500)
    or v_option_count not between 2 and 12
    or (p_question_type = 'single_best_answer' and v_correct_count <> 1)
    or v_correct_count < 1 then
    raise exception 'invalid question payload';
  end if;
  if v_publish and (char_length(trim(coalesce(p_explanation, ''))) < 20
    or char_length(trim(coalesce(p_source_title, ''))) < 3) then
    raise exception 'published question requires explanation and source';
  end if;
  if v_publish and p_question_type <> 'single_best_answer' then
    raise exception 'question type not yet publishable';
  end if;
  if exists(
    select 1 from jsonb_array_elements(p_options) option_row
    where char_length(trim(coalesce(option_row->>'text', ''))) not between 1 and 2000
  ) then raise exception 'invalid option payload'; end if;

  if p_question_id is null then
    insert into public.questions(
      specialty_id, pathology_id, question_text, clinical_vignette,
      learning_objective, explanation, difficulty, xp_reward, question_type,
      review_status, is_published, exam_domain, source_title,
      source_url, source_year, estimated_seconds, image_url, image_alt,
      version, created_by, reviewed_by, reviewed_at, published_at
    ) values (
      p_specialty_id, p_pathology_id, trim(p_question_text),
      nullif(trim(p_clinical_vignette), ''), nullif(trim(p_learning_objective), ''),
      nullif(trim(p_explanation), ''), p_difficulty, p_xp_reward, p_question_type,
      p_review_status, v_publish,
      nullif(trim(p_exam_domain), ''), nullif(trim(p_source_title), ''),
      nullif(trim(p_source_url), ''), p_source_year, p_estimated_seconds,
      nullif(trim(coalesce(p_image_url, '')), ''), nullif(trim(coalesce(p_image_alt, '')), ''),
      1, p_admin_user_id, case when p_review_status = 'approved' then p_admin_user_id else null end,
      case when p_review_status = 'approved' then now() else null end,
      case when v_publish then now() else null end
    ) returning id, version into v_question_id, v_version;
  else
    select jsonb_build_object(
      'question_text', q.question_text, 'explanation', q.explanation,
      'difficulty', q.difficulty, 'review_status', q.review_status,
      'is_published', q.is_published, 'image_url', q.image_url, 'image_alt', q.image_alt,
      'options', (select coalesce(jsonb_agg(jsonb_build_object(
        'text', qo.option_text, 'isCorrect', qo.is_correct,
        'orderIndex', qo.order_index, 'explanation', qo.explanation
      ) order by qo.order_index), '[]'::jsonb) from public.question_options qo where qo.question_id = q.id)
    ) into v_old_snapshot
    from public.questions q where q.id = p_question_id for update;
    if not found then raise exception 'question not found'; end if;

    update public.questions set
      specialty_id = p_specialty_id, pathology_id = p_pathology_id,
      question_text = trim(p_question_text),
      clinical_vignette = nullif(trim(p_clinical_vignette), ''),
      learning_objective = nullif(trim(p_learning_objective), ''),
      explanation = nullif(trim(p_explanation), ''), difficulty = p_difficulty,
      xp_reward = p_xp_reward, question_type = p_question_type,
      review_status = p_review_status, is_published = v_publish,
      exam_domain = nullif(trim(p_exam_domain), ''), source_title = nullif(trim(p_source_title), ''),
      source_url = nullif(trim(p_source_url), ''), source_year = p_source_year,
      estimated_seconds = p_estimated_seconds,
      image_url = nullif(trim(coalesce(p_image_url, '')), ''),
      image_alt = nullif(trim(coalesce(p_image_alt, '')), ''),
      version = version + 1,
      reviewed_by = case when p_review_status = 'approved' then p_admin_user_id else null end,
      reviewed_at = case when p_review_status = 'approved' then now() else null end,
      published_at = case when v_publish then coalesce(published_at, now()) else null end
    where id = p_question_id returning id, version into v_question_id, v_version;

    insert into public.question_revisions(question_id, version, changed_by, change_type, snapshot)
    values (v_question_id, v_version - 1, p_admin_user_id, 'updated', v_old_snapshot)
    on conflict(question_id, version) do nothing;
    delete from public.question_options where question_id = v_question_id;
  end if;

  for v_option in select value from jsonb_array_elements(p_options) loop
    insert into public.question_options(
      question_id, option_text, is_correct, order_index, explanation
    ) values (
      v_question_id, trim(v_option->>'text'),
      coalesce((v_option->>'isCorrect')::boolean, false),
      coalesce((v_option->>'orderIndex')::integer, 0),
      nullif(trim(coalesce(v_option->>'explanation', '')), '')
    );
  end loop;

  delete from public.question_topic_links where question_id = v_question_id;
  insert into public.question_topic_links(question_id, topic_id)
  select v_question_id, topic_id
  from unnest(coalesce(p_topic_ids, array[]::uuid[])) topic_id
  where exists(select 1 from public.question_topics qt where qt.id = topic_id and (qt.specialty_id is null or qt.specialty_id = p_specialty_id))
  on conflict do nothing;

  if p_question_id is null then
    insert into public.question_revisions(question_id, version, changed_by, change_type, snapshot)
    values (v_question_id, 1, p_admin_user_id, 'created', jsonb_build_object('question_text', trim(p_question_text)))
    on conflict do nothing;
  end if;
  return v_question_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Bucket de stockage pour les images de questions : public en lecture
--    (les images illustrent des questions déjà publiées), écriture réservée
--    aux administrateurs.
-- ---------------------------------------------------------------------------
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('question-images', 'question-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict(id) do update set public = true, file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

create policy "question_images_select_public" on storage.objects for select to anon, authenticated
using (bucket_id = 'question-images');
create policy "question_images_insert_admin" on storage.objects for insert to authenticated
with check (bucket_id = 'question-images' and exists(
  select 1 from public.profiles where id = auth.uid() and role = 'admin'
));
create policy "question_images_update_admin" on storage.objects for update to authenticated
using (bucket_id = 'question-images' and exists(
  select 1 from public.profiles where id = auth.uid() and role = 'admin'
))
with check (bucket_id = 'question-images' and exists(
  select 1 from public.profiles where id = auth.uid() and role = 'admin'
));
create policy "question_images_delete_admin" on storage.objects for delete to authenticated
using (bucket_id = 'question-images' and exists(
  select 1 from public.profiles where id = auth.uid() and role = 'admin'
));

commit;
