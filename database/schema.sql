create table if not exists students (
  id bigserial primary key,
  nim varchar(50) not null,
  nama text not null,
  owner_username varchar(50) not null default '',
  created_at timestamptz not null default now(),
  unique (owner_username, nim)
);

alter table if exists students
  add column if not exists owner_username varchar(50) not null default '';

alter table if exists students
  drop constraint if exists students_nim_key;

alter table if exists students
  add constraint students_owner_username_nim_key unique (owner_username, nim);

create index if not exists idx_students_owner_username on students(owner_username);

create table if not exists app_users (
  id bigserial primary key,
  username varchar(50) not null unique,
  full_name text not null,
  is_active boolean not null default true,
  password_hash text not null default '',
  password_salt text not null default '',
  created_at timestamptz not null default now()
);

alter table if exists app_users
  add column if not exists password_hash text not null default '';

alter table if exists app_users
  add column if not exists password_salt text not null default '';

create table if not exists student_scores (
  student_id bigint not null references students(id) on delete cascade,
  criterion_id varchar(100) not null,
  quick_select varchar(20),
  manual_value numeric(6, 2),
  final_score numeric(6, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (student_id, criterion_id)
);

create table if not exists assistance_sessions (
  id bigserial primary key,
  student_id bigint not null references students(id) on delete cascade,
  tgl_asistensi date not null,
  label text,
  created_at timestamptz not null default now()
);

create table if not exists assistance_scores (
  assistance_session_id bigint not null references assistance_sessions(id) on delete cascade,
  criterion_id varchar(100) not null,
  quick_select varchar(20),
  manual_value numeric(6, 2),
  final_score numeric(6, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (assistance_session_id, criterion_id)
);

create table if not exists module_session_scores (
  assistance_session_id bigint not null references assistance_sessions(id) on delete cascade,
  criterion_id varchar(100) not null,
  quick_select varchar(20),
  manual_value numeric(6, 2),
  final_score numeric(6, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (assistance_session_id, criterion_id)
);
