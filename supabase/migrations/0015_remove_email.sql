-- The MVP sends no email. Remove the private email reader without a data change.
do $$
begin
  if to_regprocedure('kingdown_jobs.user_email(uuid)') is not null then
    if exists(select from pg_roles where rolname = 'kingdown_plugin_runtime') then
      revoke execute on function kingdown_jobs.user_email(uuid) from kingdown_plugin_runtime;
    end if;
    drop function kingdown_jobs.user_email(uuid);
  end if;
end $$;
