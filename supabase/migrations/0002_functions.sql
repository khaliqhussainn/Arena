-- Atomic vote casting: insert the vote row (unique constraint enforces
-- one vote per fingerprint per match) and bump the match's counter in a
-- single statement, so concurrent votes can never lose an increment.
create or replace function cast_vote(p_match_id uuid, p_fingerprint text, p_side text)
returns matches
language plpgsql
as $$
declare
  v_match matches;
begin
  insert into votes (match_id, voter_fingerprint, side)
  values (p_match_id, p_fingerprint, p_side);

  if p_side = 'a' then
    update matches set votes_a = votes_a + 1
      where id = p_match_id and status = 'active'
      returning * into v_match;
  else
    update matches set votes_b = votes_b + 1
      where id = p_match_id and status = 'active'
      returning * into v_match;
  end if;

  if v_match.id is null then
    raise exception 'match_not_active' using errcode = 'P0001';
  end if;

  return v_match;
end;
$$;
