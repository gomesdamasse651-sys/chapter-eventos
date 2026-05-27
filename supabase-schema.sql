-- Lotes
create table lotes (
  id serial primary key,
  numero int unique not null,
  preco_f numeric not null,
  preco_m numeric not null,
  vendidos_f int not null default 0,
  vendidos_m int not null default 0,
  limite_f int not null default 25,
  limite_m int not null default 25,
  ativo boolean not null default false
);

-- Insere lotes (1 a 10 pra cobrir bastante)
insert into lotes (numero, preco_f, preco_m, ativo) values
  (1, 35, 45, true),
  (2, 45, 55, false),
  (3, 55, 65, false),
  (4, 65, 75, false),
  (5, 75, 85, false);

-- Cupons
create table cupons (
  id uuid default gen_random_uuid() primary key,
  codigo text unique not null,
  criado_por text not null,
  usos int not null default 0,
  ativo boolean not null default true,
  criado_em timestamptz default now()
);

-- Grupos
create table grupos (
  id uuid primary key,
  responsavel_nome text not null,
  responsavel_email text not null,
  quantidade int not null,
  total_pago numeric not null,
  criado_em timestamptz default now()
);

-- Ingressos
create table ingressos (
  id uuid default gen_random_uuid() primary key,
  nome text not null,
  email text not null,
  telefone text,
  sexo text not null check (sexo in ('F', 'M')),
  lote_id int references lotes(id),
  preco numeric not null,
  seguro boolean not null default false,
  cupom_id uuid references cupons(id),
  qr_code text unique,
  grupo_id uuid references grupos(id),
  order_nsu text not null,
  status text not null default 'pendente' check (status in ('pendente', 'pago', 'reembolsado')),
  transaction_nsu text,
  capture_method text,
  paid_amount numeric,
  receipt_url text,
  paid_at timestamptz,
  criado_em timestamptz default now()
);

-- Índices
create index on ingressos(order_nsu);
create index on ingressos(status);
create index on ingressos(qr_code);

-- Desabilita RLS para acesso via service key
alter table lotes disable row level security;
alter table cupons disable row level security;
alter table grupos disable row level security;
alter table ingressos disable row level security;
