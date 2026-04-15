create table if not exists students (
  id bigserial primary key,
  nim varchar(50) not null unique,
  nama text not null,
  created_at timestamptz not null default now()
);

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
