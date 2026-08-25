-- Atomic vote boost: adds `p_amount` votes to one side of a live match in
-- a single statement (same lost-update protection as cast_vote). No voter
-- fingerprint involved — boosts are granted server-side only after a
-- LemonSqueezy webhook confirms payment.
create or replace function boost_votes(p_match_id uuid, p_side text, p_amount int)
returns matches
language plpgsql
as $$
declare
  v_match matches;
begin
  if p_side = 'a' then
    update matches set votes_a = votes_a + p_amount
      where id = p_match_id and status = 'active'
      returning * into v_match;
  else
    update matches set votes_b = votes_b + p_amount
      where id = p_match_id and status = 'active'
      returning * into v_match;
  end if;

  return v_match;
end;
$$;
