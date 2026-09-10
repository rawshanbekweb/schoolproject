--
-- PostgreSQL database dump
--

\restrict jjQx9700N7DVSw2c3OzXdfHq9WB83uah2ToU7Bzf4iozKESaeOVR6acf3O7yUsQ

-- Dumped from database version 16.15 (Debian 16.15-1.pgdg12+2)
-- Dumped by pg_dump version 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;


--
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION vector IS 'vector data type and ivfflat and hnsw access methods';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._migrations (
    filename character varying(255) NOT NULL,
    run_at timestamp with time zone DEFAULT now()
);


--
-- Name: achievements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.achievements (
    id integer NOT NULL,
    person_name character varying(200) NOT NULL,
    person_type character varying(20),
    class_name character varying(20),
    subject_id integer,
    title character varying(300) NOT NULL,
    description text,
    photo_url text,
    award_date date,
    level character varying(50),
    is_featured boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT achievements_person_type_check CHECK (((person_type)::text = ANY ((ARRAY['student'::character varying, 'teacher'::character varying])::text[])))
);


--
-- Name: achievements_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.achievements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: achievements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.achievements_id_seq OWNED BY public.achievements.id;


--
-- Name: ai_usage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_usage (
    id integer NOT NULL,
    feature character varying(50) NOT NULL,
    month character(7) NOT NULL,
    calls integer DEFAULT 0,
    tokens_in bigint DEFAULT 0,
    tokens_out bigint DEFAULT 0,
    cost_usd numeric(12,6) DEFAULT 0,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: ai_usage_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ai_usage_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ai_usage_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ai_usage_id_seq OWNED BY public.ai_usage.id;


--
-- Name: block_test_sections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.block_test_sections (
    id integer NOT NULL,
    block_test_id integer,
    subject_id integer,
    question_count smallint DEFAULT 5 NOT NULL,
    points_per_question numeric(4,2) DEFAULT 1.0 NOT NULL,
    order_index smallint DEFAULT 0 NOT NULL,
    CONSTRAINT block_test_sections_question_count_check CHECK (((question_count >= 1) AND (question_count <= 100)))
);


--
-- Name: block_test_sections_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.block_test_sections_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: block_test_sections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.block_test_sections_id_seq OWNED BY public.block_test_sections.id;


--
-- Name: block_test_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.block_test_sessions (
    id integer NOT NULL,
    block_test_id integer,
    student_name character varying(200) NOT NULL,
    class_name character varying(20),
    question_set jsonb NOT NULL,
    status character varying(20) DEFAULT 'in_progress'::character varying,
    total_score numeric(6,2),
    max_score numeric(6,2),
    section_results jsonb,
    time_spent integer,
    started_at timestamp with time zone DEFAULT now(),
    finished_at timestamp with time zone,
    CONSTRAINT block_test_sessions_status_check CHECK (((status)::text = ANY ((ARRAY['in_progress'::character varying, 'finished'::character varying])::text[])))
);


--
-- Name: block_test_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.block_test_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: block_test_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.block_test_sessions_id_seq OWNED BY public.block_test_sessions.id;


--
-- Name: block_tests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.block_tests (
    id integer NOT NULL,
    teacher_id integer,
    title character varying(300) NOT NULL,
    description text,
    grade_level smallint,
    time_limit smallint DEFAULT 0,
    target_classes text[] DEFAULT '{}'::text[],
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: block_tests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.block_tests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: block_tests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.block_tests_id_seq OWNED BY public.block_tests.id;


--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_messages (
    id integer NOT NULL,
    session_id integer,
    role character varying(10) NOT NULL,
    content text NOT NULL,
    sources jsonb DEFAULT '[]'::jsonb,
    was_grounded boolean,
    tokens_in integer DEFAULT 0,
    tokens_out integer DEFAULT 0,
    cost_usd numeric(12,6) DEFAULT 0,
    latency_ms integer,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chat_messages_role_check CHECK (((role)::text = ANY ((ARRAY['user'::character varying, 'assistant'::character varying])::text[])))
);


--
-- Name: chat_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.chat_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: chat_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.chat_messages_id_seq OWNED BY public.chat_messages.id;


--
-- Name: chat_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_sessions (
    id integer NOT NULL,
    session_key uuid NOT NULL,
    lang character varying(5) DEFAULT 'uz'::character varying,
    ip_hash character(64),
    created_at timestamp with time zone DEFAULT now(),
    last_active_at timestamp with time zone DEFAULT now()
);


--
-- Name: chat_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.chat_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: chat_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.chat_sessions_id_seq OWNED BY public.chat_sessions.id;


--
-- Name: classes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.classes (
    id integer NOT NULL,
    name character varying(20) NOT NULL,
    grade smallint NOT NULL,
    letter character(2) NOT NULL,
    shift smallint DEFAULT 1,
    student_count smallint DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT classes_grade_check CHECK (((grade >= 1) AND (grade <= 11))),
    CONSTRAINT classes_shift_check CHECK ((shift = ANY (ARRAY[1, 2])))
);


--
-- Name: classes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.classes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: classes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.classes_id_seq OWNED BY public.classes.id;


--
-- Name: contact_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contact_messages (
    id integer NOT NULL,
    full_name character varying(200) NOT NULL,
    phone character varying(20),
    email character varying(100),
    subject character varying(300) NOT NULL,
    message text NOT NULL,
    status character varying(20) DEFAULT 'new'::character varying,
    replied_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT contact_messages_status_check CHECK (((status)::text = ANY ((ARRAY['new'::character varying, 'read'::character varying, 'replied'::character varying])::text[])))
);


--
-- Name: contact_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.contact_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: contact_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.contact_messages_id_seq OWNED BY public.contact_messages.id;


--
-- Name: content_embeddings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.content_embeddings (
    id integer NOT NULL,
    source_table character varying(50) NOT NULL,
    source_id integer NOT NULL,
    chunk_index smallint DEFAULT 0 NOT NULL,
    title character varying(300),
    content text NOT NULL,
    url_path character varying(300),
    content_hash character(64) NOT NULL,
    embedding public.vector(768),
    tsv tsvector GENERATED ALWAYS AS (to_tsvector('simple'::regconfig, (((COALESCE(title, ''::character varying))::text || ' '::text) || content))) STORED,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: content_embeddings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.content_embeddings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: content_embeddings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.content_embeddings_id_seq OWNED BY public.content_embeddings.id;


--
-- Name: control_work_scores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.control_work_scores (
    id integer NOT NULL,
    control_work_id integer,
    student_name character varying(200) NOT NULL,
    score numeric(4,1) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT control_work_scores_score_check CHECK (((score >= (0)::numeric) AND (score <= (5)::numeric)))
);


--
-- Name: control_work_scores_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.control_work_scores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: control_work_scores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.control_work_scores_id_seq OWNED BY public.control_work_scores.id;


--
-- Name: control_works; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.control_works (
    id integer NOT NULL,
    teacher_id integer,
    subject_id integer,
    class_id integer,
    quarter smallint NOT NULL,
    year smallint NOT NULL,
    work_date date,
    title character varying(200),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT control_works_quarter_check CHECK ((quarter = ANY (ARRAY[1, 2, 3, 4])))
);


--
-- Name: control_works_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.control_works_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: control_works_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.control_works_id_seq OWNED BY public.control_works.id;


--
-- Name: documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documents (
    id integer NOT NULL,
    uploader_id integer,
    title character varying(300) NOT NULL,
    description text,
    file_url text NOT NULL,
    file_size integer DEFAULT 0,
    file_type character varying(20) DEFAULT 'pdf'::character varying,
    category character varying(50) DEFAULT 'other'::character varying,
    is_public boolean DEFAULT true,
    download_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT documents_category_check CHECK (((category)::text = ANY ((ARRAY['orders'::character varying, 'regulations'::character varying, 'reports'::character varying, 'plans'::character varying, 'other'::character varying])::text[])))
);


--
-- Name: documents_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.documents_id_seq OWNED BY public.documents.id;


--
-- Name: lesson_times; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lesson_times (
    id integer NOT NULL,
    shift smallint NOT NULL,
    lesson_num smallint NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    CONSTRAINT lesson_times_shift_check CHECK ((shift = ANY (ARRAY[1, 2])))
);


--
-- Name: lesson_times_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lesson_times_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: lesson_times_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lesson_times_id_seq OWNED BY public.lesson_times.id;


--
-- Name: management; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.management (
    id integer NOT NULL,
    full_name character varying(200) NOT NULL,
    "position" character varying(200) NOT NULL,
    photo_url text,
    phone character varying(20),
    email character varying(100),
    order_num smallint DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: management_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.management_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: management_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.management_id_seq OWNED BY public.management.id;


--
-- Name: media; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.media (
    id integer NOT NULL,
    uploader_id integer,
    url text NOT NULL,
    thumb_url text,
    file_type character varying(20),
    file_size integer,
    alt_text character varying(300),
    album character varying(100),
    created_at timestamp with time zone DEFAULT now(),
    is_cover boolean DEFAULT false,
    CONSTRAINT media_file_type_check CHECK (((file_type)::text = ANY ((ARRAY['image'::character varying, 'video'::character varying, 'document'::character varying])::text[])))
);


--
-- Name: media_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.media_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: media_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.media_id_seq OWNED BY public.media.id;


--
-- Name: news; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.news (
    id integer NOT NULL,
    author_id integer,
    title character varying(300) NOT NULL,
    slug character varying(350) NOT NULL,
    content text NOT NULL,
    cover_url text,
    category character varying(20) DEFAULT 'news'::character varying,
    is_published boolean DEFAULT false,
    published_at timestamp with time zone,
    views integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT news_category_check CHECK (((category)::text = ANY ((ARRAY['news'::character varying, 'event'::character varying, 'announcement'::character varying])::text[])))
);


--
-- Name: news_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.news_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: news_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.news_id_seq OWNED BY public.news.id;


--
-- Name: otm_calibration; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.otm_calibration (
    id integer NOT NULL,
    slope numeric(8,4) NOT NULL,
    intercept numeric(8,4) NOT NULL,
    sample_size integer NOT NULL,
    computed_at timestamp with time zone DEFAULT now()
);


--
-- Name: otm_calibration_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.otm_calibration_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: otm_calibration_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.otm_calibration_id_seq OWNED BY public.otm_calibration.id;


--
-- Name: otm_major_cutoffs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.otm_major_cutoffs (
    id integer NOT NULL,
    major_id integer,
    year smallint NOT NULL,
    cutoff_score numeric(6,2) NOT NULL,
    max_possible_score numeric(6,2) DEFAULT 189.9 NOT NULL
);


--
-- Name: otm_major_cutoffs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.otm_major_cutoffs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: otm_major_cutoffs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.otm_major_cutoffs_id_seq OWNED BY public.otm_major_cutoffs.id;


--
-- Name: otm_major_subjects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.otm_major_subjects (
    id integer NOT NULL,
    major_id integer,
    subject_id integer,
    weight numeric(3,1) DEFAULT 1.0 NOT NULL
);


--
-- Name: otm_major_subjects_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.otm_major_subjects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: otm_major_subjects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.otm_major_subjects_id_seq OWNED BY public.otm_major_subjects.id;


--
-- Name: otm_majors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.otm_majors (
    id integer NOT NULL,
    university_name character varying(300) NOT NULL,
    major_name character varying(300) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: otm_majors_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.otm_majors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: otm_majors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.otm_majors_id_seq OWNED BY public.otm_majors.id;


--
-- Name: otm_outcome_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.otm_outcome_reports (
    id integer NOT NULL,
    student_name character varying(200) NOT NULL,
    class_name character varying(20),
    graduation_year smallint NOT NULL,
    major_id integer,
    internal_weighted_pct numeric(5,2) NOT NULL,
    real_dtm_score numeric(6,2) NOT NULL,
    real_dtm_max_score numeric(6,2) DEFAULT 189.9 NOT NULL,
    was_admitted boolean,
    notes text,
    created_by integer,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: otm_outcome_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.otm_outcome_reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: otm_outcome_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.otm_outcome_reports_id_seq OWNED BY public.otm_outcome_reports.id;


--
-- Name: questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.questions (
    id integer NOT NULL,
    teacher_id integer,
    subject_id integer,
    grade_level smallint,
    text text NOT NULL,
    option_a text NOT NULL,
    option_b text NOT NULL,
    option_c text NOT NULL,
    option_d text NOT NULL,
    correct character(1) NOT NULL,
    difficulty smallint DEFAULT 1,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT questions_correct_check CHECK ((correct = ANY (ARRAY['A'::bpchar, 'B'::bpchar, 'C'::bpchar, 'D'::bpchar]))),
    CONSTRAINT questions_difficulty_check CHECK ((difficulty = ANY (ARRAY[1, 2, 3]))),
    CONSTRAINT questions_grade_level_check CHECK (((grade_level >= 1) AND (grade_level <= 11)))
);


--
-- Name: questions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.questions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.questions_id_seq OWNED BY public.questions.id;


--
-- Name: schedule; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schedule (
    id integer NOT NULL,
    class_id integer,
    subject_id integer,
    teacher_id integer,
    day_of_week smallint NOT NULL,
    lesson_num smallint NOT NULL,
    shift smallint DEFAULT 1,
    room character varying(20),
    CONSTRAINT schedule_day_of_week_check CHECK (((day_of_week >= 1) AND (day_of_week <= 6))),
    CONSTRAINT schedule_lesson_num_check CHECK (((lesson_num >= 1) AND (lesson_num <= 8))),
    CONSTRAINT schedule_shift_check CHECK ((shift = ANY (ARRAY[1, 2])))
);


--
-- Name: schedule_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.schedule_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: schedule_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.schedule_id_seq OWNED BY public.schedule.id;


--
-- Name: school_info; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.school_info (
    id integer NOT NULL,
    key character varying(100) NOT NULL,
    title character varying(200),
    content text,
    updated_by integer,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: school_info_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.school_info_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: school_info_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.school_info_id_seq OWNED BY public.school_info.id;


--
-- Name: subjects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subjects (
    id integer NOT NULL,
    name character varying(150) NOT NULL,
    short_name character varying(20),
    icon character varying(50),
    created_at timestamp with time zone DEFAULT now(),
    description text,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: subjects_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.subjects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: subjects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.subjects_id_seq OWNED BY public.subjects.id;


--
-- Name: teacher_subjects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teacher_subjects (
    id integer NOT NULL,
    teacher_id integer,
    subject_id integer
);


--
-- Name: teacher_subjects_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.teacher_subjects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: teacher_subjects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.teacher_subjects_id_seq OWNED BY public.teacher_subjects.id;


--
-- Name: test_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.test_configs (
    id integer NOT NULL,
    teacher_id integer,
    subject_id integer,
    title character varying(300) NOT NULL,
    description text,
    grade_level smallint,
    mode character varying(20) DEFAULT 'named'::character varying,
    time_limit smallint DEFAULT 0,
    question_count smallint DEFAULT 10,
    difficulty smallint DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    file_url text,
    file_type character varying(10),
    answer_key jsonb,
    target_classes text[] DEFAULT '{}'::text[],
    CONSTRAINT test_configs_difficulty_check CHECK (((difficulty >= 0) AND (difficulty <= 3))),
    CONSTRAINT test_configs_mode_check CHECK (((mode)::text = ANY ((ARRAY['anonymous'::character varying, 'named'::character varying, 'timed'::character varying])::text[])))
);


--
-- Name: test_configs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.test_configs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: test_configs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.test_configs_id_seq OWNED BY public.test_configs.id;


--
-- Name: test_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.test_sessions (
    id integer NOT NULL,
    student_name character varying(200) NOT NULL,
    class_name character varying(20),
    subject_id integer,
    grade_level smallint,
    total_q smallint NOT NULL,
    correct_q smallint NOT NULL,
    score numeric(5,2),
    time_spent integer,
    started_at timestamp with time zone DEFAULT now(),
    finished_at timestamp with time zone,
    config_id integer
);


--
-- Name: test_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.test_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: test_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.test_sessions_id_seq OWNED BY public.test_sessions.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    login character varying(100) NOT NULL,
    password_hash text NOT NULL,
    full_name character varying(200) NOT NULL,
    role character varying(20) NOT NULL,
    photo_url text,
    phone character varying(20),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    bio text,
    experience_years smallint DEFAULT 0,
    education text,
    achievements_text text,
    is_public boolean DEFAULT false,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['super_admin'::character varying, 'content_manager'::character varying, 'teacher'::character varying])::text[])))
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: achievements id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.achievements ALTER COLUMN id SET DEFAULT nextval('public.achievements_id_seq'::regclass);


--
-- Name: ai_usage id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_usage ALTER COLUMN id SET DEFAULT nextval('public.ai_usage_id_seq'::regclass);


--
-- Name: block_test_sections id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.block_test_sections ALTER COLUMN id SET DEFAULT nextval('public.block_test_sections_id_seq'::regclass);


--
-- Name: block_test_sessions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.block_test_sessions ALTER COLUMN id SET DEFAULT nextval('public.block_test_sessions_id_seq'::regclass);


--
-- Name: block_tests id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.block_tests ALTER COLUMN id SET DEFAULT nextval('public.block_tests_id_seq'::regclass);


--
-- Name: chat_messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages ALTER COLUMN id SET DEFAULT nextval('public.chat_messages_id_seq'::regclass);


--
-- Name: chat_sessions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_sessions ALTER COLUMN id SET DEFAULT nextval('public.chat_sessions_id_seq'::regclass);


--
-- Name: classes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes ALTER COLUMN id SET DEFAULT nextval('public.classes_id_seq'::regclass);


--
-- Name: contact_messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_messages ALTER COLUMN id SET DEFAULT nextval('public.contact_messages_id_seq'::regclass);


--
-- Name: content_embeddings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_embeddings ALTER COLUMN id SET DEFAULT nextval('public.content_embeddings_id_seq'::regclass);


--
-- Name: control_work_scores id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.control_work_scores ALTER COLUMN id SET DEFAULT nextval('public.control_work_scores_id_seq'::regclass);


--
-- Name: control_works id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.control_works ALTER COLUMN id SET DEFAULT nextval('public.control_works_id_seq'::regclass);


--
-- Name: documents id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents ALTER COLUMN id SET DEFAULT nextval('public.documents_id_seq'::regclass);


--
-- Name: lesson_times id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_times ALTER COLUMN id SET DEFAULT nextval('public.lesson_times_id_seq'::regclass);


--
-- Name: management id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.management ALTER COLUMN id SET DEFAULT nextval('public.management_id_seq'::regclass);


--
-- Name: media id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media ALTER COLUMN id SET DEFAULT nextval('public.media_id_seq'::regclass);


--
-- Name: news id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news ALTER COLUMN id SET DEFAULT nextval('public.news_id_seq'::regclass);


--
-- Name: otm_calibration id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.otm_calibration ALTER COLUMN id SET DEFAULT nextval('public.otm_calibration_id_seq'::regclass);


--
-- Name: otm_major_cutoffs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.otm_major_cutoffs ALTER COLUMN id SET DEFAULT nextval('public.otm_major_cutoffs_id_seq'::regclass);


--
-- Name: otm_major_subjects id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.otm_major_subjects ALTER COLUMN id SET DEFAULT nextval('public.otm_major_subjects_id_seq'::regclass);


--
-- Name: otm_majors id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.otm_majors ALTER COLUMN id SET DEFAULT nextval('public.otm_majors_id_seq'::regclass);


--
-- Name: otm_outcome_reports id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.otm_outcome_reports ALTER COLUMN id SET DEFAULT nextval('public.otm_outcome_reports_id_seq'::regclass);


--
-- Name: questions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions ALTER COLUMN id SET DEFAULT nextval('public.questions_id_seq'::regclass);


--
-- Name: schedule id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule ALTER COLUMN id SET DEFAULT nextval('public.schedule_id_seq'::regclass);


--
-- Name: school_info id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.school_info ALTER COLUMN id SET DEFAULT nextval('public.school_info_id_seq'::regclass);


--
-- Name: subjects id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subjects ALTER COLUMN id SET DEFAULT nextval('public.subjects_id_seq'::regclass);


--
-- Name: teacher_subjects id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_subjects ALTER COLUMN id SET DEFAULT nextval('public.teacher_subjects_id_seq'::regclass);


--
-- Name: test_configs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_configs ALTER COLUMN id SET DEFAULT nextval('public.test_configs_id_seq'::regclass);


--
-- Name: test_sessions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_sessions ALTER COLUMN id SET DEFAULT nextval('public.test_sessions_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: _migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._migrations (filename, run_at) FROM stdin;
001_init.sql	2026-09-08 09:28:16.37003+00
002_extended.sql	2026-09-08 09:28:16.386253+00
003_exam_file.sql	2026-09-08 09:28:16.388363+00
004_target_classes.sql	2026-09-08 09:28:16.390068+00
005_unique_class_name.sql	2026-09-08 09:28:16.39288+00
006_cleanup_duplicates.sql	2026-09-08 09:28:16.396924+00
007_block_tests.sql	2026-09-08 09:28:16.405215+00
008_pgvector.sql	2026-09-08 09:28:16.424195+00
009_chat_history.sql	2026-09-08 09:28:16.432723+00
010_otm_majors.sql	2026-09-09 16:04:18.924999+00
011_otm_outcomes.sql	2026-09-09 17:06:31.475806+00
\.


--
-- Data for Name: achievements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.achievements (id, person_name, person_type, class_name, subject_id, title, description, photo_url, award_date, level, is_featured, created_at) FROM stdin;
1	Nurmatova Zilola	student	9-A	\N	Matematika fanidan viloyat olimpiadasi g'olibi	Viloyat bosqichida birinchi o'rinni egalladi va respublika bosqichiga yo'llanma oldi	\N	2026-03-15	viloyat	f	2026-09-08 09:32:00.896721+00
2	Sobirov Jasur	student	11-B	\N	Informatika bo'yicha respublika tanlovi sovrindori	Dasturlash yo'nalishida uchinchi o'rin	\N	2026-04-20	respublika	f	2026-09-08 09:32:00.896721+00
3	Rahimova Dilnoza	teacher	\N	\N	Yilning eng yaxshi o'qituvchisi	Tuman miqyosida yilning eng yaxshi o'qituvchisi deb topildi	\N	2026-05-10	tuman	f	2026-09-08 09:32:00.896721+00
\.


--
-- Data for Name: ai_usage; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ai_usage (id, feature, month, calls, tokens_in, tokens_out, cost_usd, updated_at) FROM stdin;
1	embedding	2026-09	1	1391	0	0.000000	2026-09-08 09:32:54.348899+00
2	chatbot	2026-09	14	13136	5995	0.032335	2026-09-08 09:54:48.575737+00
\.


--
-- Data for Name: block_test_sections; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.block_test_sections (id, block_test_id, subject_id, question_count, points_per_question, order_index) FROM stdin;
\.


--
-- Data for Name: block_test_sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.block_test_sessions (id, block_test_id, student_name, class_name, question_set, status, total_score, max_score, section_results, time_spent, started_at, finished_at) FROM stdin;
5	\N	Test O'quvchi	11-A	[]	finished	82.00	100.00	[{"total_q": 20, "correct_q": 17, "subject_id": 1}, {"total_q": 20, "correct_q": 13, "subject_id": 5}]	1800	2026-09-10 11:22:20.223443+00	2026-09-10 11:42:20.223443+00
\.


--
-- Data for Name: block_tests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.block_tests (id, teacher_id, title, description, grade_level, time_limit, target_classes, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chat_messages (id, session_id, role, content, sources, was_grounded, tokens_in, tokens_out, cost_usd, latency_ms, created_at) FROM stdin;
1	1	user	Maktabga birinchi sinfga qanday hujjatlar kerak?	[]	\N	0	0	0.000000	\N	2026-09-08 09:33:54.186364+00
2	1	assistant	1-sinfga qabul qilish uchun quyidagi hujjatlar talab etiladi:\n\n* Bolaning tug'ilganlik haqidagi guvohnomasi nusxasi;\n* Ota-onaning pasport nusxasi;\n* Tibbiy ma'lumotnoma (086/u shakli);\n* 6 dona 3x4 o'lchamdagi fotosurat.\n\nHujjatlar har yili 1-iyundan 25-avgustgacha, ish kunlari soat 09:00 dan 16:00 gacha maktab kotibiyatiga topshiriladi.	[{"title": "Maktabga qabul", "url_path": "/about", "source_table": "school_info"}, {"title": "Bepul ovqatlanish tartibi haqida buyruq", "url_path": "/documents", "source_table": "documents"}, {"title": "Maktab ichki tartib qoidalari", "url_path": "/documents", "source_table": "documents"}, {"title": "2026-2027 o'quv yili tantanali ochildi", "url_path": "/news/oquv-yili-ochildi", "source_table": "news"}]	t	1274	306	0.002103	2409	2026-09-08 09:33:54.186364+00
3	1	user	Кто директор школы?	[]	\N	0	0	0.000000	\N	2026-09-08 09:33:56.637221+00
4	1	assistant	Директором школы является Каландаров Баходир Сотиволдиевич. Для связи с руководством вы можете воспользоваться страницей обращений на сайте школы.	[{"title": "Maktab direktori", "url_path": "/about", "source_table": "management"}, {"title": "O'quv ishlari bo'yicha direktor o'rinbosari", "url_path": "/about", "source_table": "management"}, {"title": "Tarbiya ishlari bo'yicha direktor o'rinbosari", "url_path": "/about", "source_table": "management"}]	t	1114	380	0.002261	2444	2026-09-08 09:33:56.637221+00
5	1	user	Yupiter sayyorasining massasi qancha?	[]	\N	0	0	0.000000	\N	2026-09-08 09:33:57.069747+00
6	1	assistant	Bu savolga javob berish uchun menda ma'lumot yo'q. Aniq javob olish uchun maktab ma'muriyatiga murojaat sahifasi orqali yozishingiz mumkin.	[]	f	0	0	0.000000	428	2026-09-08 09:33:57.069747+00
7	2	user	Maktabga birinchi sinfga qanday hujjatlar kerak?	[]	\N	0	0	0.000000	\N	2026-09-08 09:34:37.702953+00
8	2	assistant	Birinchi sinfga qabul uchun quyidagi hujjatlar talab etiladi:\n\n* Bolaning tug'ilganlik haqidagi guvohnomasi nusxasi;\n* Ota-onaning pasport nusxasi;\n* Tibbiy ma'lumotnoma (086/u shakli);\n* 6 dona 3x4 o'lchamdagi fotosurat.\n\nHujjatlar maktab kotibiyatiga ish kunlari soat 09:00 dan 16:00 gacha topshiriladi.	[{"title": "Maktabga qabul", "url_path": "/about", "source_table": "school_info"}]	t	1274	274	0.001983	2386	2026-09-08 09:34:37.702953+00
9	3	user	Kutubxona necha soatgacha ochiq?	[]	\N	0	0	0.000000	\N	2026-09-08 09:34:40.147264+00
10	3	assistant	Maktab kutubxonasi dushanbadan shanbagacha soat 08:00 dan 17:00 gacha ochiq. Siz kutubxona xizmatlaridan soat 17:00 gacha foydalanishingiz mumkin.	[{"title": "Kutubxona", "url_path": "/about", "source_table": "school_info"}]	t	1136	377	0.002266	2442	2026-09-08 09:34:40.147264+00
11	4	user	Kutubxona necha soatgacha ochiq?	[]	\N	0	0	0.000000	\N	2026-09-08 09:40:13.583751+00
12	4	assistant	Maktab kutubxonasi dushanbadan shanbagacha soat 08:00 dan 17:00 gacha ishlaydi. Demak, kutubxona soat 17:00 gacha ochiq bo'ladi.	[{"title": "Kutubxona", "url_path": "/about", "source_table": "school_info"}]	t	1136	424	0.002442	2632	2026-09-08 09:40:13.583751+00
13	5	user	Mektepke qabillaw qalay ámelge asiriladi?	[]	\N	0	0	0.000000	\N	2026-09-08 09:46:21.349549+00
14	5	assistant	Birinshi klassqa qabıllaw hár jılı 1-iyunnan 25-avgustqa shekem dawam etedi. Hújjetler mektep kánseliyariyasına jumıs kúnleri saat 09:00 den 16:00 ge shekem tapsırıladı.\n\nKerekli hújjetler:\n• Balanıń tuwılǵanlıq haqqındaǵı gúwalıǵı nusqası\n• Ata-ananıń pasport nusqası\n• Meditsinalıq maǵlıwmatnama (086/u forması)\n• 6 dana 3x4 ólshemindegi súwret	[{"title": "Maktabga qabul", "url_path": "/about", "source_table": "school_info"}, {"title": "Bepul ovqatlanish tartibi haqida buyruq", "url_path": "/documents", "source_table": "documents"}]	t	1168	728	0.003606	3638	2026-09-08 09:46:21.349549+00
15	6	user	6-A sinfning payshanba kuni jadvali qanday?	[]	\N	0	0	0.000000	\N	2026-09-08 09:53:41.315662+00
16	6	assistant	6-A sinfining (2-smena) payshanba kungi dars jadvali:\n\n* **1-dars (13:30–14:15):** Matematika — Toshmatov Sardor Ulugbekovich, 101-xona\n* **2-dars (14:20–15:05):** O'zbek tili va adabiyoti — Aliyev Aziz Baxtiyorovich, 102-xona\n* **3-dars (15:15–16:00):** Ingliz tili — Rahimova Dilnoza Erkinovna, 103-xona\n* **4-dars (16:05–16:50):** Rus tili — Toshmatov Sardor Ulugbekovich, 104-xona	[{"title": "6-A sinf jadvali", "url_path": "/schedule", "source_table": "schedule"}]	t	796	743	0.003383	3103	2026-09-08 09:53:41.315662+00
17	7	user	Hozir nechanchi dars ketyapti?	[]	\N	0	0	0.000000	\N	2026-09-08 09:53:43.334211+00
18	7	assistant	Hozir soat 14:53 bo'lib, 2-smenaning 2-darsi (14:20–15:05) ketmoqda. Bu vaqtda 6-A, 6-B, 7-A va 7-B sinflarida dars mashg'ulotlari olib borilmoqda.	[{"title": "Hozirgi dars", "url_path": "/schedule", "source_table": "schedule"}]	t	775	361	0.001935	2016	2026-09-08 09:53:43.334211+00
19	8	user	Darslar necha soatda boshlanadi?	[]	\N	0	0	0.000000	\N	2026-09-08 09:53:44.973479+00
20	8	assistant	Maktabimizda darslar smenasiga qarab quyidagi vaqtlarda boshlanadi:\n\n* **1-smena:** 08:00 da\n* **2-smena:** 13:30 da	[{"title": "Dars vaqtlari", "url_path": "/schedule", "source_table": "schedule"}]	t	857	341	0.001922	1638	2026-09-08 09:53:44.973479+00
21	9	user	Расписание 6-Б класса на пятницу	[]	\N	0	0	0.000000	\N	2026-09-08 09:53:46.794877+00
22	9	assistant	Класс «6-Б» не найден в базе данных школы. Пожалуйста, проверьте правильность написания названия класса и повторите запрос.	[{"title": "Sinf topilmadi", "url_path": "/schedule", "source_table": "schedule"}]	t	630	354	0.001800	1820	2026-09-08 09:53:46.794877+00
23	10	user	9-V sinf jadvali qanday?	[]	\N	0	0	0.000000	\N	2026-09-08 09:53:48.44294+00
24	10	assistant	Maktab bazasida "9-V" nomli sinf topilmadi. Iltimos, sinf nomini tekshirib, qayta so'rang.	[{"title": "Sinf topilmadi", "url_path": "/schedule", "source_table": "schedule"}]	t	636	281	0.001531	1646	2026-09-08 09:53:48.44294+00
25	11	user	Maktab qachon tashkil etilgan?	[]	\N	0	0	0.000000	\N	2026-09-08 09:53:50.85431+00
26	11	assistant	Shomanay tumani 14-umumiy o'rta ta'lim maktabi 1985-yilda tashkil etilgan. Maktab yillar davomida minglab o'quvchilarga sifatli ta'lim berib kelmoqda.	[{"title": "Tashkil etilgan", "url_path": "/about", "source_table": "school_info"}, {"title": "Maktab tarixi", "url_path": "/about", "source_table": "school_info"}, {"title": "Ish vaqti", "url_path": "/about", "source_table": "school_info"}]	t	918	323	0.001900	2409	2026-09-08 09:53:50.85431+00
27	12	user	Расписание 6-Б класса на пятницу	[]	\N	0	0	0.000000	\N	2026-09-08 09:54:46.407295+00
28	12	assistant	Расписание уроков для 6-«Б» класса (2-я смена) на пятницу:\n\n* **1-й урок (13:30–14:15):** Английский язык — Алиев Азиз Бахтиёрович, кабинет 101\n* **2-й урок (14:20–15:05):** Русский язык — Рахимова Дильноза Эркиновна, кабинет 102\n* **3-й урок (15:15–16:00):** Физика — Тошматов Сардор Улугбекович, кабинет 103\n* **4-й урок (16:05–16:50):** Химия — Алиев Азиз Бахтиёрович, кабинет 104	[{"title": "6-B sinf jadvali", "url_path": "/schedule", "source_table": "schedule"}]	t	773	759	0.003426	4805	2026-09-08 09:54:46.407295+00
29	13	user	9-V sinf jadvali qanday?	[]	\N	0	0	0.000000	\N	2026-09-08 09:54:48.579243+00
30	13	assistant	Maktab bazasida "9-V" nomli sinf topilmadi. Hozirda bazada faqat 6-A, 6-B, 7-A va 7-B sinflari mavjud. Qo'shimcha ma'lumot olish uchun maktab ma'muriyatiga yoki murojaat sahifasi orqali bog'lanishingiz mumkin.	[{"title": "Sinf topilmadi", "url_path": "/schedule", "source_table": "schedule"}]	t	649	344	0.001777	2168	2026-09-08 09:54:48.579243+00
\.


--
-- Data for Name: chat_sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chat_sessions (id, session_key, lang, ip_hash, created_at, last_active_at) FROM stdin;
1	5be2451f-3138-4d46-a7d2-b864a06944e2	uz	\N	2026-09-08 09:33:51.798165+00	2026-09-08 09:33:56.642758+00
2	b23b8134-ff29-4e29-8e7e-ca92162cd091	uz	\N	2026-09-08 09:34:35.335373+00	2026-09-08 09:34:35.335373+00
3	22a8028e-69b0-47e7-b63f-1a16d7c8d7d0	uz	\N	2026-09-08 09:34:37.706119+00	2026-09-08 09:34:37.706119+00
4	fd232b6a-dbbb-447a-b5a8-7be6bcf45013	uz	009cdd3bef7a6d3a02da43238200623fdc79da57f119c880d3d58c76dc0f1631	2026-09-08 09:40:10.956398+00	2026-09-08 09:40:10.956398+00
5	8595d5b4-5b55-4cb2-9739-5f4f55d9f7ac	kaa	009cdd3bef7a6d3a02da43238200623fdc79da57f119c880d3d58c76dc0f1631	2026-09-08 09:46:17.717786+00	2026-09-08 09:46:17.717786+00
6	de52bd1b-22cf-4831-bfdb-8c1c84a7d0e1	uz	\N	2026-09-08 09:53:38.231394+00	2026-09-08 09:53:38.231394+00
7	18b72957-8ca4-49a7-9a1e-6521f6907630	uz	\N	2026-09-08 09:53:41.31872+00	2026-09-08 09:53:41.31872+00
8	06290c42-36c9-4058-8810-6295cbaffc92	uz	\N	2026-09-08 09:53:43.335776+00	2026-09-08 09:53:43.335776+00
9	d9982389-da9b-4338-876f-733e9ccaeb24	ru	\N	2026-09-08 09:53:44.974898+00	2026-09-08 09:53:44.974898+00
10	3e6c6b0b-c4f5-4473-a87d-94f172755ea6	uz	\N	2026-09-08 09:53:46.79717+00	2026-09-08 09:53:46.79717+00
11	55fc0f46-ee5e-4bfc-9212-99e8c914a31f	uz	\N	2026-09-08 09:53:48.444385+00	2026-09-08 09:53:48.444385+00
12	ccaf96c0-ac73-4084-92dc-52c7d887aef5	ru	\N	2026-09-08 09:54:41.62129+00	2026-09-08 09:54:41.62129+00
13	ded28420-a8d7-4b30-a7e8-2eee395d2a80	uz	\N	2026-09-08 09:54:46.410803+00	2026-09-08 09:54:46.410803+00
\.


--
-- Data for Name: classes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.classes (id, name, grade, letter, shift, student_count, created_at) FROM stdin;
1	6-A	6	A 	2	0	2026-09-08 09:53:27.789292+00
2	6-B	6	B 	2	0	2026-09-08 09:53:27.790579+00
3	7-A	7	A 	2	0	2026-09-08 09:53:27.791427+00
4	7-B	7	B 	2	0	2026-09-08 09:53:27.792199+00
\.


--
-- Data for Name: contact_messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.contact_messages (id, full_name, phone, email, subject, message, status, replied_at, created_at) FROM stdin;
\.


--
-- Data for Name: content_embeddings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.content_embeddings (id, source_table, source_id, chunk_index, title, content, url_path, content_hash, embedding, updated_at) FROM stdin;
1	school_info	1	0	Maktab tarixi	Maktab haqida — Maktab tarixi\n\nShomanay tumani 14-umumiy o'rta ta'lim maktabi 1985-yilda tashkil etilgan. Maktab O'zbekiston Respublikasining Qoraqalpog'iston Respublikasi Shomanay tumanida joylashgan bo'lib, yillar davomida minglab o'quvchilarga ta'lim bergan.	/about	d665c42106bc7164f6daa8e0414f8c9b77515f56f52e845d169eb3df565f49c2	[0.002829736,0.02458025,0.03842759,-0.006983722,0.028522436,-0.006265169,0.024154557,0.025768502,0.03058285,-0.10194221,-2.385379e-05,-0.011079983,-0.023569262,-0.0112515,-0.039726913,0.04082062,-0.033974584,0.04950262,-0.0018908076,-0.04801712,0.0011263742,0.024285339,0.039233632,0.0034835066,-0.037183423,-0.0124906795,0.01871902,-0.03737711,-0.02580959,0.23884866,-0.026852908,-0.023395186,0.01891494,-0.052042544,0.024623714,-0.0037491967,-0.012017949,-0.01023368,-0.011207941,0.02905814,0.020739608,-0.002776123,-0.01976313,0.0027942194,-0.028698536,-0.017703788,0.015062034,-0.007515399,0.018718295,-0.035529327,0.02620672,-0.043475587,0.033514492,-0.033466112,0.0030042923,0.038647503,-0.011689877,0.021357022,0.041294552,0.0037261837,-0.013007689,0.04439357,-0.0032157362,-0.017724734,0.005260448,-0.05371742,-0.003932794,-0.0020888147,0.014677714,0.015300048,0.006614141,-0.013299475,0.014994343,0.037722617,-0.036311183,-0.00028605462,-0.020659588,0.017594926,0.04609795,0.022747485,-0.014536391,0.01970281,0.00077837607,-0.01238244,0.034126624,0.014060289,-0.008587935,-0.0025574076,0.006677485,0.0035642858,0.017558394,0.046603717,0.026299477,-0.010572827,-0.013484259,0.007902932,-0.035889,0.01082677,0.0045372867,0.034689672,0.035546932,0.0069910823,0.0013607893,0.015756978,0.0077014696,-0.019245,0.010726064,0.024849351,0.059493396,0.007479781,-0.007975129,-0.26702935,-0.013264873,0.034716994,-0.03490753,-0.041310377,0.003334867,0.06198415,0.040877327,0.0031573372,0.024388198,-0.009826762,0.0006595277,-0.015564641,0.0013229679,0.0071243728,-0.008079735,0.017447729,0.0050328453,-0.025035465,-0.048983734,-0.011823149,0.04696153,-0.039772145,0.022755178,-0.039520606,-0.0074913786,0.02822099,0.04579814,-0.034761142,-0.033520352,-0.0062905294,0.04517442,0.03564019,-0.0040764427,-0.015126794,0.054630686,0.037471432,0.0589165,0.012782441,-0.011812148,0.0059467694,0.011353745,0.03328894,-0.009661179,-0.030919705,-0.0052281134,0.024885522,0.011339842,0.028209468,-0.012355214,-0.007360657,0.0025721767,0.042408146,-0.04108391,-0.0018837777,-0.04651562,0.030884096,-0.018199336,0.0037362478,-0.023863398,-0.040310565,0.005473142,-0.019678706,0.008573632,0.02724583,-0.017896762,0.013057949,0.030558601,0.030067367,0.024280537,-0.026331367,-0.04519129,0.0138252275,-0.025527326,0.012982173,0.0506034,-0.0256851,0.009865138,0.00979453,0.03139615,0.024009341,0.0077303546,-0.018987931,0.014736997,0.005340362,-0.018286811,-0.0353165,0.0375791,-0.0125311725,0.04019475,0.009095759,0.019800492,-0.04716274,0.009068584,0.04030959,0.013197934,0.020236881,-0.012049965,-0.06329619,0.03000105,-0.0054714032,-0.01466107,-0.03486818,0.02389373,-0.06645797,-0.009448951,0.019157965,-0.037347913,-0.048149973,0.021458408,-0.027779965,0.028737182,-0.023980724,0.027374486,-0.020007756,0.05690801,0.0037139491,-0.017854402,0.01871803,-0.019422732,0.012533343,-0.014863159,0.0071815746,-0.029869951,-0.023036988,0.013109589,-0.002817788,0.024491858,-0.06048557,-0.020241383,-0.023584086,0.011253879,0.0043869186,0.007919558,0.004282899,0.026281897,-0.003476499,-0.045269188,-0.043486077,-0.0011831,-0.0034768023,0.030459959,-0.002567467,-0.029057678,-0.012640075,-0.0038975968,-0.014235278,-0.007386789,-0.059248,0.025335206,-0.038047694,0.006446285,-0.019030515,0.046421066,-0.016918939,-0.03257221,-0.031254333,0.04302709,0.010672959,0.021948535,0.04458285,0.05974416,-0.008745481,0.0244908,0.0448515,-0.03225907,-0.015740346,0.02995784,0.020283058,-0.017816003,-0.035100494,-0.03898847,0.035012897,-0.01663953,0.043388106,-0.03991967,0.021178087,0.006276937,0.010828381,-0.008778665,0.05091731,-0.022913957,-0.04070115,0.010406398,0.021803891,0.021099957,0.025395371,-0.038700975,0.007992576,-0.036448497,0.0066999644,0.028412381,0.020794205,0.024915308,0.014198946,-0.003135345,0.01012221,-0.023709146,0.019530501,-0.041957047,-0.020426681,-0.03255159,0.000881477,0.00559369,-0.007831409,-0.07382607,0.0062318635,-0.0342614,-0.18470995,0.011279557,-0.034576382,-0.050428323,-0.014235836,-0.017303986,-0.014548634,-0.022594376,-0.046729136,-0.032069217,-0.05978974,0.0009997827,0.04145617,0.0657859,0.0022041467,-0.024861883,0.008862418,-0.009805944,-0.00480008,0.02997625,0.035457015,-0.023776434,-0.31911853,-0.01668684,0.04889172,0.04756531,-0.03727621,-0.01991423,-0.040059123,0.0091599,0.037964273,-0.028873306,0.050198454,-0.017732989,0.0028399576,-0.025134599,0.059695654,-0.029326139,0.00418287,-0.015157935,-0.018616837,0.016560871,-0.0144594,0.012066423,-0.046925083,-0.030875416,-0.043470368,-0.014849964,0.036777295,0.032221332,0.031915616,0.00614181,0.028688854,0.007498045,0.014913958,0.02812194,-0.0025745092,-0.016292451,0.042351283,0.0040132073,0.004896779,0.06967949,-0.04709893,-0.015981283,0.010776957,0.015313331,0.029918939,0.008148334,-0.005529333,0.024489935,-0.022069255,-0.004847569,0.066384055,-0.008113368,-0.009056847,-0.010177115,-0.047716312,-0.0006971376,-0.023267679,-0.005180233,0.0091941925,-0.019184731,0.017034404,0.040887497,-0.0116139315,0.017082525,0.027467756,0.0208309,-0.017103441,-0.016688501,-0.05836132,-0.03807117,-0.0548783,0.028408188,0.016850675,0.05778359,0.050825648,-0.025610017,0.04803578,0.02614883,0.004138667,-0.0048743924,0.023036167,0.015441611,-0.021969825,-0.022197967,-0.02231314,0.029071854,0.008072824,-0.008959588,0.009669759,-0.0521163,-0.0010594121,-0.017233644,-0.0010501194,0.0058672084,0.00015069397,-0.02045671,-0.074624725,0.0023591246,-0.031139374,-0.026674185,0.005782323,0.031878985,-0.04089037,0.040878173,-0.00012199766,-0.019774739,-0.019691998,-0.02199367,0.009952546,0.026319796,-0.022328405,0.0095059555,0.029103871,0.065556265,0.015352126,-0.031379275,-0.021776445,-0.0097724665,-0.0044061453,-0.04917265,-0.0032179782,0.0295209,-0.000317527,0.00017922683,0.026125167,-0.0072686397,-0.008343701,0.030558433,-0.026748631,-0.023477735,0.019014796,0.023563895,0.0038330127,0.032001533,-0.010132333,0.004218767,-0.041149102,-0.027049778,-0.006498782,0.0013618447,-0.026658678,0.012046671,-0.015816756,0.04758156,-0.015063241,0.025473299,0.02210609,0.050777156,0.036892157,0.0031763911,0.006910728,-0.08983444,0.01935219,0.013102049,-0.0009141483,0.029503072,0.03507931,0.0099585075,-0.0185496,0.077575944,0.015178007,-0.09289399,0.032142263,0.019213844,0.07851709,-0.0082274685,-0.27899623,-0.04589952,0.002216532,0.012680247,0.02547286,-0.0383633,0.00794384,-0.04042456,0.029786298,-0.0145250205,0.035651032,0.0049838633,-0.015737448,0.033029452,0.018389551,-0.009663352,-0.023567457,0.016661316,-0.013918553,-0.01000131,0.03773977,-0.02786781,-0.038217857,0.011756444,0.023868548,-0.04834147,0.042784464,-0.034854922,0.019775053,0.005901188,0.008563509,-0.0030893057,0.0034192654,0.007412696,-0.026408928,0.029745229,0.067089595,-0.01547785,0.00675556,-0.026499426,-0.008990645,0.012952481,-0.0341098,-0.0051422277,-0.024521606,-0.013306457,0.03322077,-0.11463369,-0.025146421,0.01662541,-8.453322e-05,0.04541647,-0.011904712,0.0019954934,-0.03221033,0.027917579,-0.0083121285,-0.035820533,-0.008086582,-0.023570906,0.003805628,-0.005766604,0.009618411,-0.00093039445,-0.017630791,0.014463818,-0.0038751352,0.17293365,-0.005119915,0.028500104,0.00547935,0.04581434,0.00058592326,0.035820115,-0.014779259,0.026635593,0.05041692,0.028283244,0.040663566,0.05166418,0.009489876,-0.022049189,0.0063666957,0.00019634157,-0.0025689881,0.05458062,-0.0008043357,-0.014454896,-0.024387019,-0.0031630746,0.056862876,0.0339891,0.00554203,0.0010695328,0.013451005,0.008179346,0.0070716394,-0.02836419,-0.04713656,0.026469517,-0.04485319,0.024063408,0.015892392,-0.054461278,0.023987189,-0.034491777,0.012413562,-0.024723606,0.04949752,0.01752793,-0.05843249,-0.0138249565,0.021620061,-0.05364458,0.005749235,-0.013541782,-0.04356224,0.001058998,-0.05512807,0.00017807476,-0.010477601,0.0021154801,-0.0071085715,-0.01194696,-0.028518217,0.0013215449,0.037980426,0.010705038,-0.0060908543,0.03323026,0.010747079,0.013651402,0.044478603,-0.04032576,0.04817998,-0.040663462,0.017473994,0.01064498,-0.016074294,-0.036912277,-0.027096732,-0.012519802,-0.0010734773,-0.013774985,0.022587664,-0.013176922,-0.0025248912,0.028088566,0.021420307,0.015459728,-0.04142134,-0.0139764985,-0.007325657,-0.0014785663,0.01120205,-0.05332811,4.7276302e-05,0.03967063,-0.030649202,0.011523079,-0.0012593466,-0.0026259916,-0.014148111,0.0028771001,-0.007493157,-0.020247705,-0.014923424,-0.005216725,0.026238682,0.04181284,-0.009479526,-0.02312615,0.005328093,-0.0066667115,-0.008296955,0.023215767,-0.04146422,0.02252365,-0.032198984,-0.005958537,-0.014233353,-0.0032420487,0.035149645,-0.034701448,0.020999214,0.018029697,-0.021171827,-0.01048692,0.006335997,0.0031896909,-0.039236054,-0.01808837,-0.04299782,0.06463508,-0.0039608553,0.008882414,-0.006310442,0.062115774,-0.030415624,0.0036203575,-0.012944531,-0.024369096,0.012371916,0.006067268,-0.055831663,0.038443442,-0.025055205,-0.0028872604,-0.047870032,0.015362049,0.035950534,0.048275754,-0.0060999384,0.02702959,0.03082357,0.0179625,0.0011954991,-0.010506934,0.034261733,-0.02598141,0.0045837946,-0.033864133,-0.034690145,-0.011089063,0.020168478,0.086444534,-0.011200279,0.00010801029,-0.090055905,0.02762849,-0.05408012,-0.026053252,0.014841199,0.029287884,-0.04793273,-0.012643202,-0.011942524,-0.015848158,-0.05584787,0.014046651,0.023964608,0.018151632,0.03912527,0.0029610968,-0.0054523144,0.013477206,0.020584619,0.04883588,0.011566336,-0.0017804014,-0.0077459607,0.0037807524,-0.005884648,0.01616255,-0.038152553,-0.02910378,-0.017205592,-0.027752807,0.009533856,0.022632746,0.011243963]	2026-09-08 09:32:54.310023+00
2	school_info	2	0	Missiyamiz	Maktab haqida — Missiyamiz\n\nHar bir o'quvchini zamonaviy bilim va ko'nikmalar bilan qurollantirish, milliy qadriyatlarni asrash va yosh avlodni barkamol inson sifatida tarbiyalash.	/about	1ae1ccca790eb797824e4b50a24a7b9bbee678df5d3959d202d74e55fccb94b6	[-0.0006758745,0.023439646,0.024090232,0.02866059,0.010997709,-0.01577441,0.06829046,-0.026911981,0.0024557312,-0.08014717,-0.042168614,0.040791433,-0.019405197,-0.005573893,-0.024723144,0.0033271448,-0.0090282215,0.018242685,-0.0023046283,-0.017074976,0.040973958,-0.010148455,0.049215782,0.004028343,-0.028773446,-0.063242815,0.01551145,-0.020322401,-0.042961277,0.23437487,0.005431388,-0.043836728,-0.0052086674,-0.006902409,0.024421357,-0.005661694,0.01267431,0.00507353,0.0066130687,-0.018324591,-0.015713688,-0.022943424,-0.0055911755,0.0069993255,-0.03276931,-0.006963529,-0.0064042173,0.0675558,0.039379112,-0.033852205,0.012409896,-0.013895826,0.031936713,-0.007847395,-0.006858267,0.025546078,-0.024299623,0.011576107,0.023324039,0.020696694,0.010396601,0.03819592,0.02178331,0.014626789,0.033461392,-0.017623158,0.0207574,-0.015221752,0.02874715,-0.0031445853,0.023830453,0.009581894,0.004782549,0.021484513,0.015629776,-0.025920143,-0.0051868614,0.015084677,0.019363996,-0.0048373314,-0.0057776007,0.024757374,-0.04912069,-0.051223755,0.021667404,-0.018988993,0.038413927,0.030384343,-0.021884328,0.042958837,0.018665437,0.031067593,0.017860783,-0.006611902,0.007523347,-0.011064785,-0.028991332,-0.0034941135,0.0061514867,0.009873405,-0.013344769,0.010570963,0.050787263,0.011542835,0.020382755,-0.025183767,0.012056848,0.0032595568,0.044800982,0.00131969,0.004688206,-0.27103898,0.031113164,0.048636433,-0.030522853,-0.053004213,-0.0054636886,-0.006128801,0.042093463,0.017123574,-0.0009875142,0.0040158634,0.00881496,-0.026753632,-0.0019287486,0.031904235,0.015191748,0.033146985,-0.03625651,0.023112407,0.01925287,0.06722182,0.0186259,-0.031406485,0.022409763,-0.008615545,-0.056603342,-0.017558245,-0.019140014,0.014381653,-0.042521533,0.012897817,0.012888961,0.01966669,0.012376943,0.0031903451,0.04718026,0.0089417985,0.075265184,0.018870847,-0.00566896,0.026298685,-0.015180084,0.02656136,0.0017112637,-0.020916654,-0.024116347,-0.004422781,0.030561041,0.034663085,-0.03962222,-0.0029475968,0.002888824,0.03385034,-0.018199565,0.01148746,0.014130838,0.008646991,-0.05612486,0.022592403,-0.028428445,0.021300394,-0.0053548114,-0.017802885,0.011178713,-0.0013169794,-0.012669881,0.035785634,0.06288037,-0.00057062204,0.024915602,-0.013087836,-0.093004204,-0.0074654934,-0.023458496,0.00632419,0.0028474769,-0.0026809669,0.025651125,0.024931457,-0.03377558,0.034220845,0.0018876946,-0.00444559,0.03739128,0.0038423673,0.02271346,-0.012569062,0.0065556155,-0.009907635,-0.0017811676,-0.010134717,0.083729506,-0.047121555,0.03289659,0.012638398,-0.048657645,0.0066521494,0.0036623355,-0.055661947,0.012003208,0.017014444,-0.031241719,-0.048304938,0.05969261,-0.0317583,0.028737472,0.032026384,-0.00046310108,0.011592708,0.027470583,-0.011916744,0.05782246,-0.07905806,0.0044325087,-0.002936195,-0.0017530263,0.010615518,0.002301794,-0.011214573,-0.030706529,-0.017957006,0.030390956,-0.014100439,-0.0039428985,-0.035673536,0.00034028382,0.012560976,0.03792536,-0.010872978,0.0073871114,0.004355668,0.020328762,0.017519172,0.012558814,0.0011340631,0.016613603,0.012670687,-0.032491967,-0.046679545,-0.02335915,-0.0060163215,0.016566712,0.032467183,0.006555345,-0.009132245,0.003942624,-0.018434735,0.004408973,-0.035724424,0.0027406465,0.015942112,-0.009397159,0.037136145,0.036756244,0.0019444489,-0.008710154,-0.082639344,0.029885894,-0.023852987,0.004672089,0.041794047,0.009299788,-0.05157765,0.021608477,0.019631278,0.0063391556,-0.0039438484,-0.04780783,-0.026752597,-0.03165757,-0.028156603,-0.02416967,0.022225812,0.033173703,0.04314584,-0.04756917,0.0031956926,-0.025646217,-0.008387241,0.070168056,0.048082694,0.019395728,-0.011744928,0.006937848,-0.010415267,0.013548051,-0.019819284,-0.059079446,0.008400031,-0.0020181194,-0.00053398317,0.005706219,0.009951275,0.034038004,-0.008519042,0.019999484,-0.019968612,0.0020077508,0.010536548,-0.03161634,0.0032388133,-0.03958429,-0.023780793,-0.014016103,0.011982826,-0.022465592,-0.02468281,-0.013707422,-0.1920272,0.015778264,-0.012728197,-0.016439894,-0.010239053,0.021414615,-0.005567825,-0.018427681,-0.0120313605,-0.028371727,-0.010834935,0.03750499,0.038721696,0.025334802,0.007429215,-0.026886214,-0.022088341,-0.009297338,0.035906773,-0.013730833,0.026288712,-0.034183275,-0.3099408,0.0006061745,0.017301079,0.004926188,-0.0035940302,0.013533148,0.022902256,-0.017979117,0.041751496,-0.0067628403,0.007097924,-0.0292671,0.015030477,-0.0189911,0.03426817,-0.044374228,-0.015839858,0.032116663,0.012920819,0.018957151,0.00017482179,0.0074489163,-0.037363578,-0.043935332,-0.023169497,0.007566604,0.02749421,0.024103252,0.016757699,0.02296232,0.052906,0.009334928,0.05456146,-0.0043595517,-0.003533988,-0.015236666,0.04291165,-0.02702938,-0.027792305,0.059044287,-0.02582159,0.037724648,0.021664018,0.060168456,0.023796549,0.009866364,-0.0067814304,0.028435605,0.0014625717,0.020415457,0.07235271,-0.037640896,0.013890117,0.041246656,-0.046033695,0.004931415,-0.028228408,0.028678186,-0.021104932,0.0061467155,0.009184575,0.02872025,-0.010516189,0.03468176,0.032215115,0.041853067,-0.019868147,-0.063555755,-0.06249529,-0.0610442,-0.05088219,-0.015211104,-0.029248118,0.024504846,-0.008316293,-0.04014183,0.08463259,0.027835278,0.009668145,-0.03533076,0.012553674,-0.024527876,-0.028413145,0.017715704,-0.06559775,0.029454743,0.018283673,-0.0019181309,0.004666163,-0.025083955,-0.06916442,-0.04439041,-0.0067804256,0.018427473,-0.027873544,-0.013403245,-0.04263193,-0.0057325177,0.015567719,-0.029407281,0.042394638,0.0541141,-0.030984724,0.04967164,-0.01865792,-0.07029258,-0.022101758,-0.06803923,-0.032942574,0.05315985,-0.017850472,-0.007207407,0.008309174,0.009388187,-0.04038411,0.027500896,-0.03765607,-0.023991177,-0.020186858,-0.0528402,0.05563219,-0.025589122,0.004236536,-0.03460958,-0.0067486707,-0.012083081,0.0052604508,0.025264157,-0.019698158,-0.0186356,-0.02575411,-0.008210607,0.027429618,-0.00417922,0.01597381,-0.04663583,-0.006462518,-0.04887609,0.029275209,0.05008861,-0.03709501,-0.015205979,0.0069590574,0.014881551,0.0022049819,0.020526953,0.01074874,-0.0156127885,0.049284678,0.000871439,0.006222184,-0.056949135,-0.008010891,-0.02290739,-0.021945318,0.0043684035,0.016495977,0.009200209,-0.05508145,0.02545507,-0.0034154563,-0.05698717,0.028828576,0.0067168414,0.025846872,0.009243889,-0.2749276,0.026568674,0.014498582,-0.0114497775,-0.019328643,-0.0021602786,0.0012011334,-0.016740264,0.021997584,-0.016257271,0.032252565,-0.020430272,-0.027021602,0.06526854,0.0074357195,0.009942582,-0.027227256,-0.010652291,-0.047097735,-0.010038185,-0.004437466,-0.009977301,-0.04841287,-0.03449672,0.054577872,-0.023351291,0.0026223508,-0.038993753,-0.014381519,0.042349923,0.0061734854,-0.00042018155,-0.022316918,-0.0101247085,-0.013908872,0.0057763387,0.03933265,0.0013677133,-0.0018242573,-0.00015475927,0.0069272825,0.06943971,0.023914231,-0.04923356,0.0014492642,0.012566505,0.011647225,-0.11571887,-0.007102535,-0.029600613,-0.03551305,0.05215486,-0.007232517,0.016592285,0.0041868063,-0.023406167,-0.033698414,-0.048647664,-0.03046167,-0.019985015,0.02685888,-0.04058697,-0.015518363,-0.024301438,0.04302059,0.03260337,0.01701588,0.14749888,0.0034940501,0.0064622513,-0.018320873,0.07295734,-0.020587426,0.0034069987,-0.043517385,0.020672988,0.014411543,-0.0072327894,0.011362847,0.036696855,-0.045423727,0.011837693,-0.011897593,-0.012359024,0.02952743,0.042354997,-0.0072699664,-0.010417418,-0.020680169,-0.0072154314,-0.013081092,0.013508047,-0.005810803,0.044763118,0.0020541563,0.03466329,0.03856579,0.009230136,-0.044996012,0.0031517276,-0.009527182,0.023514142,-0.009320731,0.0036293357,0.021730537,-0.013525571,0.025921736,-0.0031313235,0.07879379,0.06838613,-0.05975711,-0.03593855,-0.0026262382,-0.05408601,0.019257734,-0.006462245,0.009596797,0.032858115,-0.029660027,-0.029511765,0.0026395088,-0.027267098,-0.026385086,-0.03124106,-0.03282183,0.019128468,0.0106135,-0.01805674,-0.006954076,0.07510102,-0.024562381,-0.03335115,0.019212544,0.022632472,0.010489986,0.027477719,-0.0028988677,-0.00718396,-0.033048037,-0.028479774,0.022348633,0.0012528446,-0.028961502,-0.028012145,0.017805671,-0.035704978,-0.025473207,0.03507882,0.04309586,0.008298864,-0.0023203949,-0.006942175,-0.013796844,-0.0054939794,0.03342298,-0.008995531,0.0075850985,0.02331973,-0.043074388,-0.030952724,-0.003256424,0.007909201,0.019354807,-0.0027038767,-0.021803455,-0.019512985,-0.012716403,0.018808067,0.020287339,0.03466929,-0.00908712,0.00089437974,-0.051549703,-0.011157965,0.05171134,0.026052652,-0.02211091,0.06467665,-0.027359659,-0.03430007,-0.041358028,-0.040752336,0.0003225144,-0.0032927054,0.051220693,0.017760491,0.010431055,0.0018642317,-0.011380194,0.00875451,-0.0059956447,0.03707363,-0.024814386,0.103596404,-0.004632058,0.0055528297,0.02940058,-0.009156976,-0.005339115,-0.030061718,-0.025450913,0.0069843815,-0.02828216,0.038218234,-0.048438504,0.05040321,0.004340107,-0.024668664,-0.014272151,0.008571277,0.015194404,-0.00028935526,0.020004086,-0.014192332,-0.028763374,-0.021571497,0.025725935,-0.013343395,0.010728418,-0.0363846,0.0028033108,-0.021987734,0.0082745245,0.009010796,0.024092393,0.08661971,0.007309679,0.015402655,-0.060648326,0.012979509,-0.03321597,-0.00223179,0.022584086,0.025498474,-0.019608019,-0.0029536888,0.014991814,0.016251555,-0.020289099,0.0170571,0.02062102,0.03522003,0.009413279,0.038228318,-0.017825864,-0.00792485,-0.017263625,0.027238121,-0.0037575194,0.02245217,-0.04018415,0.0012958206,0.005462489,-0.030858211,-0.036856737,0.007848068,-0.034997564,-0.03801931,0.016680477,-0.0024344202,0.015318216]	2026-09-08 09:32:54.310023+00
3	school_info	3	0	Maqsadimiz	Maktab haqida — Maqsadimiz\n\n2030 yilga kelib viloyatdagi eng nufuzli maktabga aylanish, o'quvchilarning xalqaro olimpiadalardagi ishtirokini kengaytirish.	/about	c7180292fe34ba9bd5b0e5091c5e80b1b772edf535d5935625afc3e7c932495c	[-0.018340778,0.042874288,0.029887008,0.048940584,0.015686145,0.0016514994,0.03359849,-0.029605571,-0.035648953,-0.097565986,-0.0417003,0.028883446,0.0011045962,-0.022484304,-0.015519504,0.00012473261,-0.019554717,-0.010653303,0.0046695797,-0.039231095,0.0069227302,-0.02089333,0.020882213,0.0074155033,-0.031692643,-0.069721155,-0.003503807,0.02297185,-0.061497238,0.23271413,-0.043930832,-0.057712752,-0.0066258134,0.00053991843,0.045570374,-0.0050677173,0.0033711111,-0.03470406,-0.03623838,0.0070145223,-0.036205396,-0.0053041093,-0.024525696,0.006987005,0.021437174,0.023302605,0.0019873723,0.029055329,0.016954057,-0.029440563,-0.0049315044,-0.022847883,0.013397317,-0.0106812995,-0.009265807,0.043712,-0.011117341,0.011643975,0.0039201137,0.035764452,-0.0020289943,0.072801135,0.020711455,0.029171979,0.029100772,0.0073525044,0.031315092,-0.037361834,0.029327437,0.034630347,0.049100347,0.008160709,-0.022214781,0.009183301,-0.0024836182,-0.015645422,0.0073661944,0.00058186793,0.0249342,-0.013473852,0.045246992,0.023049902,-0.025344864,-0.0063700243,0.005558576,0.011608426,0.018271908,0.018751455,-0.026094884,0.061180558,0.0128795765,0.0052119126,-0.014815052,0.0028474177,0.01607144,-0.008379838,-0.0133261625,-0.0077038463,0.006863223,0.030569157,-0.0057243863,0.02615649,0.05706321,-0.018051855,0.024242058,-0.024222016,0.03551881,-0.012418244,0.026549434,0.0015355404,-0.021355884,-0.27622938,0.033471964,-0.015389335,-0.04874097,-0.062122073,-0.014446214,0.02783471,0.07082313,0.008525896,0.020855838,0.019361816,0.014462812,0.015829172,-0.012056815,-0.009569133,0.007358174,0.01572971,-0.01454194,0.056850273,0.0090115145,0.040646635,0.040252212,-0.05199816,-0.018733315,0.0154438885,-0.039339762,-0.030035947,-0.0025593704,-0.015848696,-0.02925598,-0.025775976,0.002653728,0.020180238,0.011202803,-0.042395152,0.05780178,0.055716753,0.06537137,0.028553471,-2.5580144e-05,0.021425728,-0.0015146771,0.034197416,-0.03195888,-0.013198954,-0.02151556,0.026680132,0.021910243,0.029828347,-0.034487348,-0.006245966,-0.020948784,0.022702899,-0.022100981,0.0021243324,0.016527612,0.008575255,-0.04282544,0.007849923,-0.041213285,0.045517027,-0.031060537,0.00082656584,0.030046688,-0.0083286725,0.0004008852,0.049713135,0.048302233,0.030074453,0.017854173,-0.05003193,-0.067715354,-0.013170062,-0.021782776,-0.0039656553,-0.0030751545,-0.019137518,-0.031463526,0.025498984,-0.020665271,0.014536019,0.023901917,-0.039326347,0.016904835,0.027216826,0.0155782085,0.0051281345,-0.0052873623,-0.0066255364,-0.02907851,-0.043077294,0.055667713,-0.041993666,0.033835594,0.035709154,-0.008077614,0.019657316,0.030548498,-0.079350956,0.019332768,0.038031973,-0.034460127,-0.013995952,0.021663887,-0.023892147,0.02221331,0.026808769,-0.0107831005,0.033653334,0.04685743,-0.018854145,0.042755436,-0.038874853,0.021351269,0.020558843,0.041047778,0.014142882,0.011478554,-0.02564639,-0.023539431,-0.024134764,-0.017125962,-0.019276423,-0.012062407,-0.042210642,0.02034487,0.015309745,0.053323552,-0.027002458,0.042861287,0.0028207402,0.014613612,-0.02003064,-0.0039374926,-0.011258547,0.0052840174,-0.008526882,-0.046272162,-0.023972917,-0.047481727,0.0073868674,0.0046083895,-0.013622646,-0.0068603125,0.010144939,-0.0032867177,0.011471228,-0.028970096,-0.060678877,0.018960867,-0.0043189637,-0.011508476,0.024739638,0.037182633,-0.030616822,-0.008219562,-0.074911356,0.026860943,-0.023986239,-0.0053364453,0.004077474,0.007160303,-0.045733918,0.005704883,0.05143151,0.03005298,0.0093876375,-0.009351685,-0.031106811,-0.06211379,-0.017807798,-0.01369421,0.009591952,0.03169798,0.04602363,-0.06435429,-0.009776148,0.0054557356,0.010251713,0.039039627,0.018743081,0.012541795,-0.019316843,-0.018951481,0.0142438365,0.009222294,-0.009896418,-0.0002610143,0.005768272,-0.0036794948,-0.015192277,0.0038500782,-0.0114925,0.028080791,0.012931379,0.029768158,-0.025302485,-0.019749988,0.022181591,-0.028330874,-0.0045068436,-0.017575214,-0.008761909,-0.0057296925,-0.019442057,-0.047405116,0.02083347,-0.015472367,-0.19771157,0.029485097,0.0030205706,0.004173858,-0.032385334,0.004592678,-0.012655121,-0.051337916,-0.018179702,-0.034291033,-0.02021271,0.024115188,0.044343043,0.020105097,0.016309125,-0.05048861,0.0010327677,-0.04351786,0.042285543,-0.016490877,-0.01326024,-0.00078613067,-0.32241434,-0.045128163,0.04151121,0.027705017,-0.013639579,-0.0093547255,0.03544355,-0.022503559,0.031325538,-0.003501329,0.0030436302,-0.010655474,-0.0042582466,0.008469094,0.062519915,-0.011324172,-0.025658375,-0.0020858995,-0.023302834,-0.011318158,-0.021016471,0.011444031,-0.033547867,-0.030820727,-0.010089699,0.00016553965,0.04076553,0.017217772,0.0053050467,0.045305733,0.024942875,0.0066414513,0.04664976,-0.006763134,-0.029246202,-0.0025977134,0.039560698,0.027420308,-0.026130795,0.040153652,-0.035136726,0.007980622,0.021865835,0.07064899,0.02528366,-0.0077943457,-0.02082816,0.02269683,-0.043681953,0.002119844,0.06490637,-0.057761136,-0.00297997,0.04261547,-0.05454004,0.0068379054,-0.014470715,0.03256367,-0.04739482,0.010821269,0.022814998,0.040994152,0.014193539,-0.017669756,0.025169754,0.02889147,-0.011594114,-0.04660151,-0.04032139,-0.048749138,-0.021857321,0.029659862,-0.0046743085,0.045856494,0.005280813,-0.042884454,0.033201765,0.021763694,-0.034190822,-0.008376443,0.025343006,-0.009243783,-0.033352446,-0.00045194564,-0.011528107,0.00482802,0.00086822297,-0.0095793735,-0.0053417557,-0.026466204,-0.064208806,-0.028392335,-0.0065265964,0.045529746,-0.041562743,0.013471811,-0.018766196,-0.0037131386,-0.011198971,-0.021304687,0.004463654,0.04653817,-0.042317603,0.03939228,-0.010841644,-0.040179793,-0.016955743,-0.06017746,0.013281915,0.039152276,-0.011996867,0.005887572,-0.02049357,0.0095024835,-0.039661,-0.0044241636,-0.0066259704,-0.017465897,-0.008318954,-0.056129403,0.051530182,0.0016209892,0.014133699,-0.03043226,-0.004402297,0.0041681924,-0.00868858,-0.018854491,-0.042532545,-0.024185382,0.0094153015,0.010282287,0.02941467,-0.027906368,0.023819774,-0.00038002222,-0.010284129,-0.016490113,0.027190614,0.0277616,-0.028426275,-0.013130831,0.018260576,0.016907914,-0.04028274,-0.00054152467,0.0033755165,0.022834621,0.046519753,0.017104289,0.02331165,-0.071344525,-0.00019784807,-0.018687531,-0.028387005,0.0223581,0.0070682596,-0.002009854,-0.06665735,0.023879744,0.010152287,-0.045349557,0.024615206,0.027673326,0.0060023363,0.020213647,-0.25723663,0.0047738063,0.031643476,-0.02405492,0.0153399035,-0.016868157,-0.01553968,-0.019104853,0.044820223,0.011493516,0.029454255,0.011237529,-0.039385602,0.02168872,0.014785027,0.015450831,-0.02173452,-0.0118896905,-0.028499398,-0.0058692303,-0.0059578433,-0.01896443,-0.035004925,-0.035103552,0.049067017,-0.060195513,0.025394531,-0.01770387,0.0073161297,0.020021064,0.008948435,-0.017379064,-0.021594249,0.030763255,-0.016853161,-0.034196313,0.050054945,0.008043914,-0.035050925,-0.036266353,-0.008217916,0.046595596,-0.020053072,-0.015782382,-0.014840495,0.023155605,0.010146636,-0.11989307,0.005918391,-0.0068909563,-0.019323066,0.034053862,0.023107575,0.032292582,0.018999426,0.037334923,-0.008450641,-0.045607213,-0.026483936,-0.059272368,0.018451998,-0.059355617,-0.026178742,-0.015861697,0.05068796,0.0060852882,0.015503876,0.14913045,-0.015406843,0.0107024275,0.026253968,0.023265887,0.0058135446,-0.014406641,-0.0054371464,0.014622732,0.016815323,0.041430518,-0.04329121,0.00798379,-0.017971504,0.018964585,-0.000106560416,0.00086714845,-0.007724007,0.044428654,-0.016886558,-0.011800137,-0.026392002,-0.00033878398,0.022678474,0.027743082,-0.0062948023,0.015104952,0.02008123,0.019130146,0.022205248,-0.0057217865,-0.024475012,0.028704217,-0.046329387,0.06513542,0.018877309,0.02681986,0.028077655,-0.007358303,0.021956585,0.003109927,0.06813208,0.047675528,-0.05118114,-0.025167746,0.03509456,-0.05417415,0.03511419,-0.006187004,-0.031861052,0.025643032,-0.034060396,-0.0064441874,-0.017252643,-0.040509753,0.017691031,-0.02035539,-0.02196796,0.017198298,-0.0004919566,-0.0028323915,-0.02679008,0.076729186,-0.014106895,0.008436859,0.04895621,-0.018336521,0.010319583,0.028843671,0.01484583,-0.00914644,-0.010422217,-0.021154642,0.007756254,-0.03346074,-0.026053598,-0.014713577,0.021954328,-0.0035260266,-0.020822482,-0.0037238067,0.01094767,-0.0052775065,-0.037578423,0.0056070145,-0.028500456,0.012716513,0.03451193,0.0007987723,0.018458642,0.0204271,-0.024646088,-0.013320585,-0.0015307177,0.012835386,0.022838242,-0.034598704,-0.018589703,0.0037294526,0.004237012,-0.014960958,0.028694661,0.024984336,-0.021868406,-0.005610099,0.0037916235,0.019652111,0.038592093,0.036642566,-0.043406323,0.0276183,-0.03960803,-0.020219618,-0.029874448,-0.014046408,-0.023770353,-0.02966662,0.027826715,0.04509598,0.0012550708,0.01361534,-0.018513212,0.0059488183,-0.015537553,0.011316007,-0.016560405,0.086038284,0.0036814855,-0.032646343,0.01957424,0.034788124,-0.0012511795,-0.020385576,-0.023117032,0.037833042,-0.028104441,0.047541272,-0.057450444,0.030571913,-0.043340098,-0.021076567,-0.015159662,0.0020088302,0.014095258,0.037001316,0.014817896,0.0050148154,-0.037699003,-0.011287501,0.051599156,-0.005683583,0.019623801,-0.052523363,0.0039382135,-0.03304766,-0.0071319584,0.0014341974,0.028122569,0.101369776,0.028916936,0.011745052,-0.06610039,-0.0025966407,-0.035078123,-0.01671106,0.037440743,0.026476284,-0.0061059333,0.029838271,0.021246092,0.039236207,-0.0065550376,0.029231757,0.037808854,0.044600602,0.014852486,0.010745976,-0.05530545,-0.0057969494,-0.014871795,0.034118373,0.0071932357,0.033008393,-0.0146059515,0.025654243,0.002477935,-0.044141073,-0.016603012,-0.006143325,-0.026966123,-0.014773858,0.013968179,0.015628112,0.0019325068]	2026-09-08 09:32:54.310023+00
4	school_info	4	0	Manzil	Maktab haqida — Manzil\n\nQoraqalpog'iston Respublikasi, Shomanay tumani, Markaziy ko'cha, 14-maktab	/about	aa9a9ac989dff02e014ebf857cd9939772ca3bbde4d8e32c0bd1e35493c23f99	[-0.005644399,0.017120985,0.05084001,-0.018273966,0.0006339706,0.014162893,0.024353381,-0.0096823005,0.012446789,-0.10312782,0.011060786,-0.010527454,-0.016294166,-0.012488063,-0.032732073,0.047757022,-0.01573324,0.042049464,-0.010813877,-0.07033236,-0.029358977,-0.0071613523,0.03382337,-0.0016703203,-0.031827003,-0.03310844,0.012851107,-0.0100867525,-0.053915206,0.24179384,-0.02231552,-0.02202544,0.006245878,-0.025069293,0.050988883,-0.030502446,0.019213064,-0.056804415,-0.029760005,0.023193572,-0.0086582,-0.016259687,-0.013266565,-0.0123248305,-0.009385931,-0.013725359,0.005716752,-0.024767041,0.0055041793,-0.03667242,0.01269477,-0.061830666,0.020716788,-0.032693673,-0.017528784,0.03986265,-0.031908933,0.01939438,0.03032803,0.02169068,0.005163499,0.030241614,0.00053037074,-0.0034875916,0.012649963,-0.03016952,-0.0080221,-0.013788936,0.0024423345,0.030988583,-0.004866624,0.017332792,-8.3023115e-05,0.048284773,-0.027641967,0.01812074,-0.0093863895,-0.013362927,0.042745538,0.03936339,-0.026050076,0.010260662,-0.01467029,-0.0393106,0.014843248,0.016149634,-0.03719304,0.027862847,-0.027288206,0.029423036,0.017534276,0.03654671,0.008970851,-0.037409402,-0.04404168,-0.0034261616,-0.008676141,0.01698289,0.017369226,0.021058496,0.0040584127,0.015137944,0.01602254,0.0023069486,0.013097656,-0.0077964147,0.039076753,0.008998903,0.06861983,0.015120542,0.024315007,-0.28074345,0.012957527,0.0393116,-0.04818542,-0.039013326,-0.010605366,0.074493885,0.057196494,0.026901914,0.030221948,-0.021803625,-0.016599284,0.0074840058,0.012229973,0.00046704558,0.021072058,0.020002222,-0.0036579012,0.007820057,-0.03831648,-0.0058145244,0.053775534,-0.010682956,0.0010359533,-0.02174529,-0.009255796,0.018204466,0.028804258,-0.034905393,-0.05044421,-0.014764115,0.03434079,0.022251494,0.01837618,-0.01731239,0.04247827,0.036460053,0.05609697,-0.007006596,0.0031841747,0.009806533,-0.009742761,0.029637512,-0.0077591757,-0.0040785423,0.0037888598,0.03472109,-0.0073195137,0.042351622,-0.027548667,-0.026415538,-0.0062860087,0.016654843,-0.031193843,-0.008598716,-0.04821317,0.016346525,-0.040209472,-0.005024337,-0.023953084,-0.008709785,-0.010065177,0.0007944424,0.033580456,0.025593288,0.006546276,0.028561635,0.020642832,0.023210485,0.020990113,-0.02575064,-0.056370653,0.014294644,-0.018125474,0.012280138,0.01639473,-0.028800886,0.0045755603,-0.0035006218,0.011251989,0.02201634,0.007981475,0.024069268,0.03856993,0.058978137,0.010805921,0.002881608,0.01962575,-0.025213024,0.0061017717,0.009850574,0.027083442,-0.017796183,0.011387859,0.05118239,-0.025581628,0.011006381,0.004166306,-0.06754532,0.028867844,-0.01505857,-0.045186467,-0.034545403,0.033466656,-0.033069726,-0.0076405406,0.038679823,-0.038572133,-0.027536545,-0.0068884557,-0.006554044,0.033559307,-0.020367684,0.008760624,-0.009365285,0.055851378,-0.011486766,0.005689481,0.01683356,-0.032969948,0.010489965,-0.010219914,0.009888237,-0.019634787,-0.048110764,0.007100669,0.0064473306,0.041690446,-0.05164248,-0.040968843,-0.017073166,0.004744722,0.015238187,0.01569451,-0.028363451,0.025792884,-0.03544724,-0.03578755,-0.04050614,-0.04212044,-0.007567671,0.05586542,-0.005643874,-0.042053457,-0.02120006,0.0029234856,-0.009071912,0.015613525,-0.008899684,0.035654303,-0.051900014,-0.006815298,-0.0031320858,0.06251133,0.0063402266,-0.014595817,-0.06565154,0.03472624,0.02068426,0.0075217057,0.03856331,0.041915417,-0.032045864,0.01939829,0.06179218,-0.047689326,-0.003972132,-0.007116489,-0.004051556,-0.034643378,-0.02962769,-0.028636115,0.039097738,-0.005297401,0.04448709,-0.053556606,0.011601829,-0.011852071,0.0050468096,0.041819774,0.051670965,-0.035340153,-0.008463409,-0.003456633,0.03374764,-0.0031709657,0.010839543,0.0014137704,0.0009867273,-0.040337764,-0.0055571217,0.0318523,-0.02805041,0.014920379,0.0025443896,0.0076466897,0.022232812,-0.05150312,-0.017632179,-0.0332011,-0.004936509,-0.05342324,-0.018123794,-0.0052974387,-0.028345997,-0.06961694,0.004771818,-0.031758066,-0.20506082,0.044542935,-0.006675681,-0.01060916,-0.00060006976,-0.004639252,0.008632434,-0.02661948,-0.038116988,-0.020624977,-0.029655648,-0.013677489,0.038930364,0.03242175,-0.0050041582,-0.014289175,0.004163573,-0.02133785,0.009564553,0.028756881,-0.010429624,-0.018392898,-0.31218505,-0.028761948,0.005104405,0.053146195,-0.030637676,0.010278759,-0.025946235,-0.052457295,0.03195916,-0.026561469,0.06769256,-0.01761114,0.01550152,-0.010975459,0.0628857,0.00850582,-0.012414976,0.009090466,0.011755513,0.006609408,-0.024542127,0.02812044,-0.03743139,-0.03839902,-0.03481172,-0.021600232,0.014758056,0.018519863,0.03353391,0.030973015,0.056252167,0.014342119,0.017949622,0.023048084,-0.008233057,-0.0035453546,0.037633043,0.0067721223,0.0013369783,0.029711913,-0.026789065,-0.007200336,0.008539904,0.02482475,0.049211387,-0.03024043,-0.031754103,0.020983947,-0.020807654,-0.024770975,0.07274487,-0.04799478,-0.012706849,-0.017988661,-0.039462402,-0.005769386,-0.018402196,0.005626979,-0.01849416,-0.019632176,0.029769775,0.028630495,-0.0088451225,-0.010994226,-0.006384073,0.039025057,0.0037261285,-0.017723093,-0.04456616,-0.034980103,-0.016396675,0.02496511,0.018186875,0.028447375,0.045850936,-0.010427974,0.04531274,0.029113878,-0.0072730137,-0.005207538,0.020410152,0.013669112,-0.02866344,0.017727409,-0.05777405,0.01719436,0.020488271,-0.007712838,0.032759476,-0.02832281,0.005582837,0.007243702,-0.007751177,-0.001634808,-0.029404635,-0.008834536,-0.079376265,0.0349148,-0.04385426,-0.020364847,0.026015107,0.02952879,-0.044892278,0.025653208,-0.009758811,-0.023341343,0.00069914316,0.007582347,0.037841007,0.007335172,-0.004818993,0.024657346,0.03910561,0.05441714,-0.007144362,-0.017148225,-0.03979127,-0.0036617215,-0.04453917,-0.036739312,-0.00030461472,0.017690336,0.02136303,0.0115703745,0.0017203842,0.015416421,0.0204841,0.038333293,-0.031689692,-0.07365736,0.026383951,0.024357056,0.017088547,-0.00936369,0.019715127,0.006274113,-0.050694756,0.0050905067,0.0033527126,0.018016707,-0.029711332,0.022244703,-0.021454629,0.005019436,-0.02707027,0.003938391,0.010976435,0.040649887,0.021575004,-0.005560694,0.0058537293,-0.08413766,-0.005006004,0.024470193,0.0010699299,0.016721753,0.021648487,-0.028685244,-0.021512248,0.05775432,0.03133407,-0.06566581,0.0067127743,0.01608704,0.0356285,0.017102486,-0.2899915,-0.021929545,0.013780302,0.00018579753,0.00012990912,-0.053178634,0.017937085,-0.019637764,0.04112896,-0.024332203,0.052017093,0.0008749799,-0.035918087,0.029869534,0.014714483,-0.0074684503,-0.014346289,0.01805565,-0.02721199,-0.03753296,0.033232484,-0.038437143,-0.044537544,-0.0093322,0.072505064,-0.046607208,0.028664367,-0.026932105,0.0077837477,0.027916359,0.014581893,0.011300538,-0.0065720505,0.0017907139,-0.011407434,-0.0025731504,0.049978707,-0.03824598,-0.0006867947,-0.051477965,0.02366899,0.0064794435,-0.0013759328,-0.0045463163,-0.018419053,0.0068552704,0.011893027,-0.12430993,-0.027059589,0.01594374,0.0029015054,0.043714594,-0.025846146,0.0024508343,-0.017202605,0.005945243,-0.023046033,-0.01508344,-0.024879042,-0.019639894,-9.5006166e-05,-0.020451562,0.0034808984,-0.01227786,0.02427193,0.03065003,0.010105615,0.1556127,-0.006413799,0.008177435,0.005689139,0.027369479,0.008651066,0.016100885,-0.018880038,0.04103902,0.007586894,0.0069866455,0.027554533,0.047868032,0.008534584,-0.0029825647,0.02262827,-0.0037269264,0.03736183,0.014212851,-0.017783336,-0.010509614,-0.0038837597,0.024919888,0.049976654,0.004744437,0.0066549997,0.0091120945,-0.0132971285,0.01010062,0.029921995,-0.027820338,-0.03428235,0.0023047999,-0.079102464,0.034067083,0.018964076,-0.027380163,0.025404928,-0.013564464,0.017592248,0.006983409,0.023007857,0.011242196,-0.04983997,-0.010616777,-0.0048381737,-0.04391186,0.010955788,0.012151649,-0.01702212,-0.0018635546,-0.038637068,-0.008479227,-0.0027534347,0.007808626,0.023634853,-0.010736208,-0.04263597,0.0020901735,0.030947689,-7.8220745e-07,-0.020715194,0.030511495,0.005758928,0.008051327,0.056322366,-0.0053223595,0.013185267,-0.039815288,0.0007410104,0.005801972,0.0054956935,-0.04819147,-0.044496223,-0.02138146,0.010700376,0.002093331,0.03395285,0.034446396,-0.03818268,0.005571354,0.016234962,0.020232784,-0.05516609,0.008044981,-0.0023732982,0.002665173,-0.0071300715,-0.068987906,0.0012288879,0.031895734,-0.047406033,-0.002203889,0.005164119,-0.0088953385,-0.00093080004,0.002855674,0.010963101,-0.008448998,0.0020721287,0.017788164,0.032719184,0.0013140665,-0.01267773,0.02018624,-0.006377675,0.013840092,0.00038431413,0.0031311398,-0.03203577,0.03542922,-0.029048761,0.0185477,-0.02978234,-0.012607522,0.022328176,-0.027674813,0.03873611,0.021624673,-0.0143843,-0.016653517,0.022491347,-0.0016562812,-0.036601156,-0.017700566,-0.033032957,0.05921909,-0.007067335,-0.01463473,0.027949471,0.04651733,-0.009756204,-0.0013215641,-0.027349155,-0.031619336,0.012958995,-0.009788738,-0.05179421,0.025785623,-0.031466532,0.03328948,-0.035575796,0.020490555,0.0107561685,0.013719937,0.02419189,0.020446919,-0.011132763,-0.016479988,0.006650575,-0.01730461,0.028548848,-0.023402154,0.02490974,-0.033372134,-0.019250298,-0.029705158,0.036539834,0.096577145,0.010665068,-0.004876404,-0.066360526,0.04348826,-0.059552375,-0.03238398,0.03776763,0.012127244,-0.022365475,-0.016450891,-0.01775628,0.042642042,-0.012904795,0.040507033,0.013072356,0.020462656,0.009294719,0.02490314,-0.027007135,0.011049622,0.027300268,0.04508981,0.025348436,-0.012771497,-0.0064270245,0.0020558126,-0.016116915,-0.020483987,-0.03130129,-0.012606927,-0.016796444,-0.02533021,0.023699835,0.04380174,0.0063942396]	2026-09-08 09:32:54.310023+00
5	school_info	5	0	Telefon	Maktab haqida — Telefon\n\n+998 61 XXX-XX-XX	/about	c3c6ec13bc9217e1751e276c58672b0443202cf58d6b4a49a3426aaf4113712a	[-0.00066925865,0.00088502164,0.033411413,-0.04907669,0.014447124,0.037605125,0.02719994,-0.005451713,-0.013437821,-0.100352846,-0.027505193,-0.0030255094,-0.047329366,-0.025740512,-0.05699558,0.023112418,-0.038645495,0.0043419763,-0.0115539385,-0.035668798,-0.037733372,-0.0031333196,0.007655171,0.011702393,-0.026688265,-0.016904572,-0.00032917183,-0.019964319,-0.020826574,0.19720355,0.003564278,-0.010572456,0.02074557,0.01900161,0.008464786,0.031771764,0.026173139,-0.042676248,-0.05580948,0.017338958,0.010001716,0.0060540563,-0.0562975,-0.032286465,0.004098842,0.005037638,0.0034941633,-0.028333474,0.008449015,-0.007615455,0.012110966,-0.045559146,0.02271625,0.010616075,-0.014592633,0.023030283,-0.028193764,0.04639873,0.010057915,0.022225155,0.02351026,-0.020511774,0.018705286,0.009308108,0.008915924,-0.0181676,0.001961867,-0.015618587,-0.03535253,0.018697977,-0.031420268,0.012082051,0.0075203804,0.034371547,0.0038024725,0.003017283,0.016441768,0.029128987,-0.010551985,0.049017467,0.025866462,0.047291692,-0.03483608,-0.0049899993,-0.0033243708,-0.03441626,-0.012191605,0.030364707,-0.07280534,0.038724307,0.023253627,0.01858925,-0.033775453,0.034701753,-0.015225147,-0.00821123,-0.004996378,-0.010160635,0.009612615,-0.006703055,-0.019568427,0.025600413,0.023506394,-0.0012708553,0.0315749,-0.022541365,0.0101476535,0.0067171915,0.044881023,0.02752392,0.009928337,-0.27949342,0.055469647,-0.008752655,-0.047837254,-0.036959123,-0.019736685,0.043968696,0.060113072,0.012718976,0.056565545,0.04961396,0.0013525643,-0.0008832015,0.008291988,0.0013820713,0.035357963,0.036694128,-0.041685417,0.0050199865,-0.034097392,0.030672109,0.029203156,-0.006076864,0.005377373,0.002372261,-0.039240208,-0.036702614,0.021819212,-0.020065662,-0.032218207,-0.020108284,0.0011855244,0.012379896,0.0023794954,0.0071795485,0.06349591,0.009082672,0.039723415,-0.01404239,-0.022976689,0.02533905,-0.051404882,0.021943362,-0.018594675,-0.012538979,-0.0065712794,0.0032592732,0.00570908,0.047439914,-0.029288834,0.020219656,-0.024554422,0.009875067,-0.02693571,-0.016638298,-0.02649801,0.026925178,-0.0599381,0.0011372276,0.007527524,0.035618138,-0.024169749,0.022085406,-0.021317955,0.009756208,-0.010068609,0.0037280729,0.016961636,0.034719188,0.028766515,0.02642469,-0.093535215,0.018847996,0.0068685003,0.008757983,0.008504694,-0.01764613,0.0037811068,0.025253203,0.01795671,0.00585185,0.036854774,0.023951255,0.04409567,0.040590197,0.040535137,-0.032244585,0.03696259,-0.038198363,-0.038545188,0.00770741,0.023347778,-0.0235536,0.013997153,0.03896663,-0.011090115,0.007313395,-0.019358987,-0.035540532,0.021015346,-0.007938167,-0.010514469,-0.020525176,0.030389922,-0.034192935,0.025438953,0.046799697,-0.005694987,0.0018998788,-0.016152991,-0.015400464,-0.006448619,-0.0029742806,0.023378508,-0.0021731951,0.06881764,0.01383331,0.028050875,0.020412512,-0.044167586,-0.03317531,0.009137322,-0.0029001636,-0.020984659,-0.048346285,0.02813186,0.01390507,0.0118597625,-0.0041094767,-0.019426392,-0.004789936,0.0038249455,-0.0034227523,-0.010673141,-0.0024351652,0.041584548,-0.0015889928,-0.034630977,-0.012971418,-0.03783491,0.00536301,0.016223656,-0.0024816121,-0.00074092625,-0.014562183,-0.002414464,0.017848976,-0.005250646,-0.045819625,0.013368162,-0.015521018,-0.03806347,-0.02654641,0.04699253,0.0020396796,0.03258404,-0.05322555,0.012799514,0.0016930556,0.002194167,0.060942773,0.05355897,-0.017670887,-0.027613955,0.06706663,0.0031511288,0.01680032,0.0056621293,-0.011431598,-0.009409847,-0.012454386,-0.0008046802,0.031143315,0.048802663,0.04046936,-0.056864116,0.024966313,0.019026319,0.01806943,0.020252526,0.017750246,-0.0011440376,-0.016530054,-0.0013146091,0.06284869,0.02865156,0.021074211,-0.004906843,0.0029035883,-0.036615912,-0.015264392,0.0022809682,-0.020043252,0.021385659,0.0240835,-0.00018344783,0.04164892,-0.027727267,-0.030994818,-0.036939368,0.004188332,-0.02664754,-0.0065227887,-0.021670569,-0.036902502,-0.031273205,-0.008704055,0.014108689,-0.18080683,-0.0033617015,-0.04229204,-0.018079683,-0.023545703,-0.022494221,0.009698494,-0.011252033,-0.018485282,-0.0054796976,-0.03522346,0.0033103724,0.045170575,0.022497576,-0.007112526,-0.0060187387,-0.02940259,-0.005067322,0.03313355,0.0039669983,-0.03010137,0.009197135,-0.31168863,-0.035884112,0.018239463,0.045545306,-0.036771357,0.0028379788,-0.019205987,-0.04138218,0.011950099,-0.026776563,0.04935268,-0.037186984,0.009469359,0.015305092,0.03556458,0.012702053,-0.011303619,-0.009471721,0.011463441,-0.027846338,-0.03937092,0.016830087,-0.00018804614,-0.031308684,-0.022026679,-0.026694372,0.03347697,0.003128745,0.018884784,0.016503857,0.05073017,0.029241286,0.013320794,-0.010311637,0.017708791,0.0076496545,-0.008683607,-0.014132835,0.043563873,0.05781994,-0.033486083,-0.0012349986,-0.009910189,0.08560224,0.0336747,-0.025767373,-0.020198524,0.010822995,-0.05325553,0.009828299,0.06648619,-0.06806239,-0.038080003,0.010906019,-0.010797818,-0.04335677,-0.032197133,0.034766044,-0.04135983,0.034123283,0.012858808,0.023706133,-0.02680243,0.029489603,0.010922734,0.06410866,-0.01342116,-0.044885628,-0.033314206,-0.05065362,-0.025687234,0.03408159,-0.0006374686,0.017287927,0.042098872,-0.033993974,0.055472013,0.03912736,-0.023074694,-0.018800309,0.014033661,0.03566848,-0.032128356,0.010531094,-0.091207184,0.024086548,0.006223616,-0.019446427,0.012071832,-0.020616662,-0.062292743,-0.020383291,0.0031589135,-0.010796205,-0.055727042,-0.0041194656,-0.045305286,0.055847235,0.008405339,-0.0065988326,0.0067572454,0.021891188,-0.048427526,0.022786299,-0.0071871798,-0.02609247,-0.012400676,-0.0030727857,0.010146911,0.022689657,-0.046093706,0.0034269658,0.0041861087,0.009485965,-0.009519087,-0.014021353,-0.017711733,-0.037175402,-0.023453638,-0.017304944,0.007713561,-0.023891937,-0.0006228357,0.0007634482,0.028398281,-0.023211969,-0.0009015877,0.06205335,-0.052039858,-0.023304924,0.005061099,-5.146303e-05,0.01853403,0.017974267,0.029851357,0.020746889,-0.011289078,-0.024347622,-0.01725983,0.016995803,-0.017840754,0.015391653,-0.0046217856,-0.0055254293,-0.044066105,0.0034014995,0.0028729062,0.05800034,0.01210565,0.020719474,-0.008664555,-0.06516421,0.005815482,0.00049004186,-0.021977462,0.018382095,-0.027127134,-0.0037718238,-0.05432913,0.03145537,0.014061274,-0.035607643,0.01459004,0.042274207,0.007421086,-0.013954035,-0.25767556,0.009227894,0.012469764,-0.02663812,0.026112994,-0.054213073,-0.013914838,-0.026882848,0.019482253,-0.055798538,0.052630644,-0.0014240167,-0.065317065,0.034215212,0.005010835,-0.018812925,-0.05244721,0.029924428,-0.044856686,-0.011421843,0.02750848,-0.02283573,-0.07198503,-0.0070296377,0.051897142,-0.10606273,0.036168292,-0.02727033,-0.005791584,0.026969865,0.022473382,-0.017621273,0.004451006,0.044160318,-0.009322692,-0.022683728,0.029571546,-0.049155343,0.026147723,-0.05916287,0.022431249,0.034852624,-0.02824095,-0.0032453847,-0.03573047,0.027014755,0.008298198,-0.116349526,0.029014768,-0.04808341,-0.033020664,0.021196634,-0.05243892,0.0005422053,0.018096602,0.0064261113,-0.0010127092,-0.017371116,0.003940774,-0.028353756,0.007061689,-0.030967064,0.003563739,-0.010552039,0.024515549,0.014717895,0.02332115,0.13961366,-0.037418593,0.018725714,0.020671142,0.06104994,0.0139842685,0.0039213467,-0.021387853,0.056887243,0.04510442,-0.012474526,-0.007743528,-0.0046120496,-0.033614744,0.03373612,0.037721023,-0.0043591824,0.0569082,0.04841812,0.008994563,-0.025939338,-0.0048394245,0.030046917,0.006522351,-0.002922297,0.041314077,0.026007593,-0.041689042,0.06941535,0.027757233,-0.04380192,-0.0062811603,-0.00074309926,-0.034457684,0.035276238,0.040116575,-0.006433367,0.009389713,0.022408664,-7.264779e-05,-0.028683268,0.010319196,0.023626285,-0.032784518,-0.025269428,0.010513672,-0.003221887,0.014356302,-0.0075994567,0.031499475,0.026600335,-0.0060963356,-0.023886312,-0.014979568,-0.0013418345,0.020924343,-0.026531758,-0.014290478,-0.05913364,0.04379776,0.018740699,-0.027504746,0.06570528,-0.0074389977,0.026519865,0.023737347,-0.009390704,-0.010625088,-0.0036076326,-0.011171164,-0.0034359184,0.0062538236,-0.065994695,0.005265835,-0.023120718,-0.0047109746,-0.019727012,0.019728683,0.0075400155,-0.045780525,0.002566668,0.011872926,0.045544747,-0.04936918,0.032196283,-0.032521095,0.001780565,0.034267314,-0.02212505,0.028808855,0.042401977,-0.013118175,-0.031362355,-0.03239164,0.019847276,-0.010152088,-0.024136392,0.022652866,-0.015333143,0.019908221,0.03544365,0.040634006,0.013655655,0.00627054,-0.03963088,0.0071897195,0.0060426546,0.027139664,0.008198858,0.0045430954,0.02530533,-0.0034485292,0.013049499,-0.054197386,-0.037095368,-0.01807946,-0.057660915,0.0063812835,0.050315868,-0.01983034,0.03310954,0.020327307,0.012350219,-0.015985662,-0.009415882,-0.0014600428,0.022419801,-0.0006854365,0.005776164,0.07131955,0.06175638,-0.0042799655,-0.030390942,-0.034897454,0.014720383,-0.018393483,0.0011876175,-0.052090235,0.00418425,-0.0018205186,-0.0002466045,-0.045715217,0.014711007,-0.003182159,0.0022711856,0.0102149,0.027231405,-0.0012789567,-0.026908057,-0.03681286,0.0040408946,-0.032106306,-0.048623573,-0.00460132,-0.038563903,-0.032263357,-0.025624689,0.016327772,0.10156638,0.012604839,-0.038961064,-0.06560139,-0.019076025,-0.05555594,-0.005908768,0.024234738,-0.0043504625,-0.049428847,0.024960833,0.026311148,0.052914236,0.008914938,0.046614163,0.0038289924,-0.013179323,0.032711115,0.0003667705,-0.0356137,0.015316409,0.016576597,0.024348123,0.039203484,-0.014237318,-0.027458062,0.0019852899,-0.009322576,-0.01763385,-0.036971923,-0.002088796,-0.04999968,-0.021353958,0.024056233,0.0030542212,-0.015600638]	2026-09-08 09:32:54.310023+00
6	school_info	6	0	Email	Maktab haqida — Email\n\nmaktab14shomanay@edu.uz	/about	49d11d889790aeea41550ae049a7427a5c78cec2eb67732a75cd811c9ca5af62	[0.03181536,0.0074869064,0.045726057,-0.017491156,5.0243456e-05,-0.0024924527,0.04242428,-0.013248198,0.0045824465,-0.04628943,-0.009329897,-0.007943582,-0.037302848,-0.008885216,-0.049483,0.026930392,-0.022904,0.019101901,-0.025305737,-0.049743917,-0.028949438,0.027989114,0.025079738,-0.0063925697,-0.02130891,-0.023490824,0.010280145,-0.01867448,-0.020238545,0.2461438,-0.0197369,-0.021158906,-0.0021108193,-0.018882621,0.055255134,-0.025534347,0.012644179,-0.0181375,-0.05538325,-0.019549493,-0.041288387,0.0026219066,0.0016539611,-0.02166858,0.0072811474,-0.022245586,0.0024521793,-0.03602079,0.013328936,-0.043908637,-0.010343092,-0.045319885,0.013888602,-0.027498763,-0.022225244,0.050327696,-0.033965956,0.028912406,0.008904682,0.011428409,0.011251607,0.018200811,0.041486874,0.008156977,0.04694284,-0.019560399,-0.0073035834,-0.016307207,0.011158517,0.031610534,0.020883774,0.033799246,0.007729301,0.0669459,-0.010233898,0.026495367,0.01926676,0.0022441528,0.014752233,0.030742656,0.012906858,0.019790305,-0.0313032,-0.01692985,0.00013972048,-0.015737599,-0.0383987,0.033344064,-0.018894762,0.04225507,0.010852712,0.017515494,0.00040113885,0.010525276,-0.025440508,-0.010069656,0.02851364,0.011156856,-0.0012367594,0.00024119591,0.008659105,0.009447173,0.037013873,0.027639579,0.026995255,-0.06232615,0.027518928,0.015825221,0.08604338,0.00082963164,0.020412652,-0.27528527,0.027914355,0.0667738,-0.037124246,-0.043303065,-0.018595,0.05119912,0.05967203,0.045807928,0.001818502,0.00805613,0.021491725,-0.018814953,-0.010538418,-0.0053940285,0.0106456475,0.02831679,0.01046667,0.040755723,0.015501948,0.007834298,0.025619628,-0.0076921815,0.0119706625,-0.03276849,-0.035064805,0.006684024,0.02896614,0.002861561,-0.039994333,0.01026508,0.045090012,0.030157862,-0.0029108918,-0.009962095,0.053582378,0.022748455,0.08214629,-0.0032127,-4.5649776e-05,-0.005931845,-0.020471223,0.034756023,-0.0022721388,-0.04398783,0.014944689,0.024313586,-0.006612176,0.061639562,-0.02608547,0.0027451997,-0.0153746465,0.024441112,-0.049687456,-0.016705133,-0.0014691502,0.023825983,-0.027381755,-0.0073406314,-0.00472673,-0.005915347,-0.012249009,-0.009379077,0.00025212968,0.028076624,0.0066696596,0.012585618,-0.0021547254,0.032826956,0.031636205,-0.0029672536,-0.09582953,0.01876254,-0.004233849,-0.012057754,0.010037421,-0.041733906,0.018368626,0.030120637,0.008016234,0.06982028,0.016658466,0.017162424,0.023323953,0.040256996,0.01472238,0.020174025,-0.005549582,-0.009921894,-0.00227465,0.010613313,0.04268936,-0.041227862,-0.0071741347,0.053494602,-0.05393703,0.032417238,-0.0020914953,-0.041240282,0.014338668,-0.020951932,-0.05203573,-0.028708458,0.018405147,-0.02581784,-0.0034487257,0.05776188,-0.003737202,0.0005574606,-0.014004405,-0.03102505,0.01541865,0.010428649,-0.0046553626,-0.026636194,0.032614503,-0.0155716995,0.04052503,-0.0020095075,-0.026763447,0.0006397259,0.021250365,-0.007990089,-0.044992402,-0.029674247,0.026474934,0.029703548,0.009240517,-0.030473823,-0.048197567,-0.014628767,0.004396443,0.01706172,0.036867104,-0.028494267,0.04314934,-0.0089633735,-0.04411049,-0.029102515,-0.04965316,-0.01327089,0.056504413,0.006336226,-0.007174572,-0.005946557,0.030824123,0.00022499722,0.017579425,-0.03003637,0.012569599,-0.018508587,0.008785356,-0.015528318,0.0422747,0.021384936,-0.009167657,-0.05642871,0.034420665,0.010913994,0.009570082,0.039637472,0.034929834,-0.011328062,0.029567065,0.055542815,-0.00073268707,0.028461251,-0.011450231,-0.023152879,0.002958609,-0.0028437832,0.019745186,0.034049537,-0.012282974,0.044887748,-0.055007763,0.030898066,0.015768383,0.011512123,0.04120462,0.04794147,0.007035054,-0.024848925,-0.002902977,0.037599195,0.009840504,0.00074075203,-0.014898933,-0.014348496,-0.032740485,-0.0033529804,0.027928337,-0.028220113,0.011205398,0.0377254,0.03673758,0.008461324,-0.01993719,-0.010883635,-0.038538277,-0.0024599757,-0.024433056,0.005723513,-0.04198447,-0.016201554,-0.079550326,-0.0071532396,-0.011008487,-0.20148428,0.014459688,-0.0006725827,-0.033550367,-0.014383226,-0.012155313,-0.034797102,-0.008789706,-0.031400636,-0.021801865,-0.018861162,-0.020732256,-0.0028540585,0.044414587,0.018287957,-0.031940266,0.013018773,-0.005972799,0.032606844,0.0048642503,-0.006217095,-0.0069302376,-0.2989546,-0.0012007435,-0.009305304,0.021508621,-0.005560193,-0.0015105816,-0.012616755,-0.015344865,0.044916835,-0.001779074,0.024770824,-0.026046734,0.007937925,0.005835804,0.035069734,-0.005490228,-0.02039612,0.02063205,0.0057261325,0.0115975775,-0.02565562,0.011898158,-0.04728498,-0.023404384,-0.037711438,-0.04428341,0.023009509,0.02011885,0.03446382,0.027318144,0.038070813,0.0015106773,0.037033435,-0.008341926,-0.0045617977,-0.01799783,0.060495466,-0.0012744148,0.021071956,0.049827557,-0.015518401,-0.059173547,0.018396435,0.0057079373,0.030400058,-0.034524083,-0.033054106,0.03683446,-0.020718433,-0.027405893,0.06962997,-0.04822575,-0.0048266747,0.00033460362,-0.017441649,-0.023857633,-0.041820534,0.033682752,-0.022647275,-0.014726408,0.033508047,0.026380016,-0.023577085,-0.009814304,0.003227273,0.046109185,-0.014562171,-0.031649623,-0.03037613,-0.04197644,-0.035424538,0.02053807,-0.0004381744,0.030002462,0.034780264,-0.017774113,0.046080366,0.02723217,0.001603522,-0.0021361855,0.01617413,0.0015133503,-0.012660296,0.03821187,-0.06573864,0.016651953,0.0021819402,-0.029799627,0.0017070046,-0.009418986,-0.02920432,0.01443736,-0.0011968687,0.023325264,-0.03856539,-0.008885331,-0.07000803,-0.0027860892,-0.009713888,-0.008410984,0.007527433,0.030506846,-0.034179363,0.042445257,-0.0030332576,-0.022719389,0.0033796001,-0.007592609,0.0440019,0.024067255,-0.058027316,-0.0038574042,0.030812807,0.049349025,-0.009282041,-0.014520037,-0.03231058,-0.008914001,-0.026741771,-0.03980901,0.00719121,0.028742287,0.023905592,0.027722415,0.0313166,-0.00014364842,-0.03657079,0.05194795,-0.05656469,-0.053069722,0.027591594,-0.0029161791,0.0035155062,0.010736109,0.01892486,0.013026873,-0.043487508,-0.0064302324,-0.012686248,0.022569086,-0.0058895573,0.0109052155,0.025530646,0.008555492,-0.021380106,0.014103106,-0.0072473595,0.05454392,0.036449954,-0.018499067,-0.013133291,-0.06608171,0.031784885,0.022916276,-0.03955506,-0.012737784,-0.02773983,0.0039963555,-0.019289203,0.068456054,0.01615057,-0.0572819,-0.017555093,0.0023952713,0.02727804,0.025906455,-0.27052265,-0.0023305751,0.024624223,0.0121075325,0.020593256,-0.059780665,0.009967807,-0.019230863,0.01376129,-0.050175108,0.04773687,0.014944708,-0.05048807,-0.0024598863,0.03248799,-0.012321208,-0.025930135,0.022955265,-0.040086873,-0.01069052,0.036256343,-0.05834562,-0.017241562,-0.018536817,0.064999916,-0.062518954,0.01735638,0.01213477,-0.030435475,0.014353035,0.020064661,0.009886952,-0.026770713,-0.0010881597,-0.01007874,-0.002698798,0.0381912,-0.05669436,0.02306885,-0.06781974,0.02623332,0.036367822,-0.017208666,-0.02512295,-0.02174699,0.028541818,0.013734228,-0.13153082,-0.009086009,-0.012851648,0.003629623,0.02750156,0.0088621965,0.025897713,-0.0029493778,-0.0066747367,0.018111803,-0.022172049,-0.0105676865,-0.025419656,0.015128155,-0.026383435,-0.023430504,0.0008450261,0.024343813,0.030680176,0.0015124873,0.13677593,-0.018529842,-0.0005469601,-2.6662507e-05,0.02697363,0.007861701,0.02219614,-0.018310497,0.059457645,0.023410868,-0.004908649,0.022886742,0.04870555,-0.022228094,-0.009054342,0.026591633,-0.0023851655,0.02635736,0.05834777,-0.008823968,-0.007825859,0.0043063606,0.01005214,0.04191564,0.005230692,0.057432916,0.0065266476,-0.017113607,0.06570413,0.030598408,-0.030263526,-0.01701467,0.013848548,-0.08337862,0.035236094,-0.01210952,-0.012241272,0.027185258,0.021612016,0.01411778,-0.0038040117,0.055227913,0.030879825,-0.01956737,-0.0008927409,0.023667626,-0.030369587,0.027540587,-0.0071317027,0.014250341,0.019144086,0.003269416,-0.033562697,-0.009864376,0.022861386,-0.002619345,0.011370487,-0.061639737,0.0049364027,0.022515219,-0.014092438,-0.00938995,0.028800594,-0.01582713,0.02861044,0.016048646,0.005531973,0.012526024,-0.040238157,-0.003397971,0.012978383,-0.014166387,-0.057992842,-0.022633988,-0.015434072,-0.027107337,-0.025072325,0.046230115,0.036347847,-0.06381575,0.01753377,0.012404887,0.02788735,-0.02900185,0.009105573,-0.00110962,-0.0032719295,-0.0122780865,-0.05080234,0.018439332,0.044527516,0.009064767,-0.04104515,0.018747455,-0.018397575,0.011089218,0.023746578,0.030395541,-0.028545516,0.024654413,0.034249365,0.0027054788,0.03039668,0.002909088,-0.004954715,0.006934302,0.026804408,0.0417644,-0.007765865,-0.03996255,0.03377564,-0.028975911,0.016661763,0.010172399,-0.025887342,-0.008633,-0.046965905,0.034942288,0.03322792,0.011015283,0.0016167202,0.030642526,0.019910755,-0.021977315,-0.01595872,-0.044857036,0.02966588,0.0015515898,-0.02142597,0.03574513,0.025261091,-0.010050965,-0.034758583,0.009880977,0.0022979183,-0.010579459,-0.020030096,-0.063498795,0.010582555,0.01877937,0.02841991,-0.02958125,0.021460978,-0.006479196,0.02822694,-0.006962881,0.0389668,0.015917713,-0.014345568,0.0066261883,-0.008973885,0.019432196,-0.021127425,0.0043770424,-0.020388955,-0.01064449,-0.024267145,0.032081593,0.09313979,-0.001480699,-0.017647222,-0.08048437,0.00785247,-0.04814271,-0.02852921,0.073873185,0.009776774,-0.03003541,-0.012971087,-0.016258994,0.04465846,-0.013385338,0.051665038,0.017339164,0.03890385,0.0082256105,0.02307539,-0.045020603,-0.003929604,0.040842447,0.056335986,0.012803772,-0.005076007,0.020942891,0.010882836,-0.00083710876,-0.016866539,-0.042963788,5.6809586e-05,-0.003896622,-0.028611306,0.011056203,0.03576315,0.0074203406]	2026-09-08 09:32:54.310023+00
7	school_info	7	0	Ish vaqti	Maktab haqida — Ish vaqti\n\nDushanba–Shanba: 08:00–18:00	/about	52d4e87dc91155ef10383b992541fc9a772f042719c4a2df99d0fdbfcf877453	[-0.0044800434,-0.014073988,0.044409174,-0.009214851,-0.014772821,0.01994845,0.050447285,0.004215636,0.008119097,-0.08651035,-0.035504743,-0.002144376,-0.029063096,-0.016487159,-0.044332344,0.036746956,-0.022501517,-0.00426542,0.024875706,-0.030637978,-0.026891321,0.0006786664,0.016388787,0.02906738,-0.013334269,-0.039862152,0.005513033,0.0117384745,-0.037953634,0.21846476,-0.019297743,0.004314553,0.0068552983,-0.03181012,0.014064204,-0.02962689,-0.027710142,-0.0035114656,-0.011142515,0.00632306,0.0054685604,-0.019419244,-0.024391942,-0.021990167,-0.023865964,0.0016311143,0.01780947,0.036391493,0.0140542025,-0.0344144,0.021625921,-0.036637746,0.033978373,0.039904334,-0.047184106,0.03843133,-0.045163292,0.020798445,0.024949534,0.015764125,-0.018532543,0.0036318307,0.020475725,0.014576702,0.030078122,-0.021197768,-0.033313308,-0.015931569,0.0034684401,0.039179817,0.020146165,0.07882603,-0.0074115405,0.042844404,-0.029941456,5.208154e-07,0.03559689,0.004365114,-0.0060587083,-0.0028605037,0.019947859,0.030261679,-0.03990553,-0.057981968,0.0031224487,-0.010507108,-0.0034129082,0.036012042,0.026926525,0.046248157,0.008507677,-0.0017497985,0.0034721938,0.017215367,-0.0132646365,0.010028269,0.005524519,-0.009880945,-0.03126326,0.045556,0.025580535,0.022726506,0.07942801,0.039541055,0.031736802,-0.016362973,0.005953214,0.014621129,0.053075984,0.024663886,0.01503553,-0.26697698,0.016092058,0.018749006,-0.06299355,-0.045702197,-0.006897158,0.07082263,0.06147948,0.027949648,0.016657664,0.008118901,0.023585122,0.0074492465,-0.005322407,0.001676056,0.029287897,-0.01537133,-0.011661911,-0.0037226551,-0.0065625953,0.04551557,-0.004588833,-0.016264131,-0.0022799321,-0.0039745034,-0.05262887,0.013308905,0.04242598,-0.0068425094,-0.046932694,0.01337254,-0.0047694505,0.048529893,-0.015287653,-0.018736523,0.028052023,0.018139651,0.0645391,-0.020502454,-0.012528662,0.02153868,-0.029214498,0.04826822,-0.01706925,-0.009833121,-0.012023606,0.023540746,0.011076914,0.03415538,-0.033736765,0.012206054,-0.01100398,0.0062973085,-0.06832278,-0.02541825,-0.0035509581,0.045679167,-0.045696143,0.0032249382,-0.022906296,0.004261649,-0.018369667,-0.013359927,0.017917736,0.013165167,0.02300815,0.015014173,0.042532567,0.029453088,0.045822,-0.0144871855,-0.074307635,0.03658446,0.0032752561,-0.0035930017,-0.0017398619,-0.015142375,0.00010071368,0.019665198,0.012985025,0.02793086,0.033671778,-0.008017456,0.021146953,0.03299583,0.0334522,-0.03559734,0.030354055,-0.0015357671,-0.0106732845,0.012424731,0.055742316,-0.019084834,-0.03874504,0.03949121,-0.036154788,0.0077373073,-0.0051535983,-0.051578086,0.017609414,-0.0009804991,-0.03247877,-0.030627517,0.0075957794,-0.02746374,0.02355336,0.047228634,-0.018405568,0.0078060664,0.014482753,-0.001197587,0.043673873,-0.010533847,0.0076997234,-0.0116077,0.018104017,0.0019720113,0.018208286,0.031218978,-0.03351606,0.00073577545,-0.001593294,0.019930862,-0.028064987,-0.037937492,-0.017844677,0.01567546,0.017405787,-0.03181971,0.01326802,-0.021665262,0.021791512,0.019345539,-0.0178065,-0.04991813,0.047457613,0.007963849,-0.028775688,-0.059255578,-0.03028578,-0.007656493,0.0028115686,0.00014752557,-0.009815666,0.023185305,-0.0022826786,-0.008087277,0.025840817,-0.019876238,0.015926708,0.0015170648,-0.037913896,0.0014314468,0.037005074,0.027873235,0.001983896,-0.058769684,0.02923352,-0.020511668,0.00055525923,0.038568214,0.015420318,-0.013509119,0.016445816,0.04582011,0.0031970725,0.025886156,-0.031803284,-0.035082836,0.008082312,-0.015664857,-0.013275512,0.04448099,0.026608022,0.050112654,-0.059290078,0.0008104228,0.022508278,0.009605076,0.06908215,0.030541562,0.0015183884,-0.008948189,-0.013957376,0.04440856,0.014828033,0.004388994,-0.044023555,0.020703765,0.0009532407,-0.027323147,0.01448384,0.016700068,0.009813869,0.02511826,-0.0069714086,0.011558632,-0.03788575,-0.009876681,-0.03067212,-0.011442351,-0.027037203,0.012150732,-0.017895907,-0.008967039,-0.023289433,-0.020078693,0.008057132,-0.2065152,0.03684229,-0.025828786,0.021758255,-0.055841316,-0.015608259,0.016315427,-0.03319513,-0.03502392,-0.0018618378,-0.04961928,0.025445124,0.033503857,-0.0022855715,0.0032666062,-0.026591644,0.009472077,-0.007893297,0.03157833,0.023684263,-0.0010067167,-0.0035398356,-0.29419664,-0.023502674,0.023503508,0.07212836,-0.006686494,-0.015135389,-0.030188045,-0.02641697,0.013088162,-0.015415735,0.017863655,-0.023848148,0.04624778,-0.03580022,0.070434086,-0.0018245388,0.015852341,0.011783832,-0.012403604,-0.017633189,0.002036319,0.0069028195,-0.0055884672,-0.017671907,-0.026440915,-0.014515609,0.029878363,0.002591072,0.024380043,0.038978174,0.043324143,-0.0038774647,0.039825134,0.012110732,0.013260496,-0.019783782,0.008704734,-0.05008391,-0.024852315,0.018336976,-0.008955558,0.015046055,0.0028393802,0.038279917,0.028279101,-0.032231107,-0.0081093125,0.0013354388,0.0031503579,-0.0026205804,0.06924269,-0.04493759,0.003572995,0.023407787,-0.020702576,-0.029865539,-0.053335804,-0.00094575813,-0.009346312,-0.008866852,0.014703026,0.040876284,-0.008222018,0.01819015,0.012970054,0.045724675,-0.01330681,-0.09802253,-0.042041384,-0.04358439,-0.029748915,-0.015572759,0.014976843,0.01461454,-0.00077756273,-0.03405631,0.07963861,0.029535273,-0.0033925716,-0.020755867,0.0046456303,0.033542313,-0.022513459,0.022678295,-0.023534952,0.009083775,-4.8554564e-05,-0.0025531726,0.042237114,-0.012695474,-0.06320671,-0.025207775,-0.008408138,0.020806069,0.001835925,0.0003427131,-0.030596921,0.049823605,-0.019444054,-0.0010274689,0.0036403628,0.055583175,-0.022307802,0.040502943,0.022923602,-0.0027477718,0.050691724,-0.025052538,0.010569029,0.058735706,-0.055493858,0.0077649294,0.037627477,0.022752827,-0.008783556,-0.027759278,-0.030802552,-0.02251178,-0.048765466,-0.08683732,0.011304022,0.005784701,0.006396725,0.014938492,0.010958062,-0.034826603,-0.028412022,0.068476886,-0.03946425,-0.021852693,0.020084187,0.0030159857,0.017344933,-0.0013486877,0.04095086,0.040981796,-0.020204106,-0.016546039,0.008337634,0.036444865,-0.013633466,0.042208795,-0.01217141,0.0379458,-0.03221607,0.01772149,0.052463923,0.047924533,0.030690081,-0.026820492,0.00059276976,-0.07373162,0.007933312,-0.0008275449,-0.023073543,-0.011009513,-0.00038029364,0.027175136,-0.05927324,0.009258369,0.036066856,-0.050710313,0.0015435326,0.018993806,-0.014954743,-0.019255778,-0.26292923,-0.005704738,0.021627586,0.010341305,0.009290677,-0.050469045,-0.00041210122,0.0029253156,-0.03524561,-0.008187501,0.03018165,0.008302179,-0.060031015,0.0007617964,-0.0110494075,0.020274762,-0.038201686,-0.0065924744,-0.0406829,-0.012185689,0.00013053024,-0.063461155,-0.051929694,-0.013147719,0.05858291,-0.09119879,0.010837757,-0.018307472,-0.03126012,0.024250757,-0.011092426,-0.012335198,-0.0019393887,0.012947126,-0.0056028394,-0.04557069,0.0734234,-0.014432128,-0.015616904,-0.048608914,0.00855975,0.037876815,-0.02393355,-0.0010149353,-0.009798028,-0.006535058,0.0076462068,-0.108398,0.018081458,-0.023404477,-0.041236974,0.04222753,-0.022660103,0.021817533,-0.01694828,0.013722377,-0.038442016,-0.0435163,-0.018624147,-0.033431925,0.0383472,-0.011025088,-0.00030724725,0.020092653,0.0013944097,0.011636434,0.040831562,0.14002745,-0.034966666,0.02892532,0.012185181,0.050831083,0.014537813,0.0025752326,-0.01827274,0.038712367,0.018722724,0.014628004,0.003546885,-0.000855255,-0.022198785,0.0028091157,0.046265904,0.0019005726,0.011287559,0.074835666,-0.012843888,0.01616231,0.0026368925,0.013254706,0.006180427,-0.0036298418,0.046422783,-0.0025441507,-0.0019891146,0.054075163,0.039589033,-0.019015165,-0.0098950155,0.01028129,-0.059054036,0.017792715,0.018876374,0.0011223647,-0.0036163246,0.0036281487,0.0044036782,-0.029134952,0.03175654,-0.0012804396,0.0008391428,-0.04469608,0.0007023624,-0.04034806,-0.00038338354,-0.030614242,-0.00856675,0.014468236,0.021466278,-0.04130528,-0.0068681687,-0.011092243,0.0021281634,-0.032126963,-0.011985667,-0.047547016,0.018939829,0.0074036904,0.005666209,0.07016158,-0.037660792,-0.0051605813,0.027810978,-0.011263634,0.013808867,0.012407109,-0.010492292,0.00059868884,0.012745659,-0.05757492,0.019746939,-0.030918662,-0.008200082,0.017027728,0.049816493,-0.028772896,-0.054842494,0.014049093,0.018748946,0.015137981,-0.02590742,0.026272105,-0.005608081,-0.00299687,0.025103476,-0.020237088,0.008750004,0.05375594,-0.021029476,-0.051103096,0.021092048,-0.01405786,-0.019526752,-0.038774516,0.0035775506,-0.017504059,0.01703927,0.008645032,0.03171897,-0.013196995,-0.0028927212,0.005541235,0.017995723,0.033798605,0.04118714,0.005778472,-0.03357187,0.033996843,-0.016472159,-0.007884954,-0.050741322,-0.024985602,-0.012480179,-0.017088765,0.07583231,0.05663484,0.004541415,-0.017706294,-0.02146405,0.028776035,-0.0067013563,0.0030473762,-0.03689245,0.047110707,0.021895291,-0.034915637,0.037748188,0.037947353,0.0020687808,-0.0018349646,-0.012250815,-0.019081783,-0.022934023,0.030570801,-0.059249915,0.032899056,0.0033661409,-0.027161455,-0.034985684,0.0042466614,0.0035905126,0.0020245512,0.019396223,-0.013199229,0.02734427,-0.0012320112,0.008314216,-0.030493937,-0.037454065,-0.02548943,0.018888665,-0.027572513,-0.0038959736,-0.030915119,0.024699988,0.09295583,0.0051933024,0.0029110536,-0.08680371,-0.013023944,-0.061490133,-0.030048968,0.05624916,0.04850888,-0.026540825,-0.004620175,0.026602857,0.04023834,-0.008604855,0.068426915,-0.018395476,0.015078528,-0.005057836,0.03876775,-0.057126682,0.024250716,0.023257295,0.01154636,0.016881509,0.0105474545,-0.006156391,-0.010243798,-0.019405184,-0.04527114,-0.011183204,-0.012680867,-0.037999664,-0.022468837,0.018207736,0.015310926,0.001992076]	2026-09-08 09:32:54.310023+00
8	school_info	8	0	Tashkil etilgan	Maktab haqida — Tashkil etilgan\n\n1985-yil	/about	6164e79867b5cc3d5a417d20f2cc63bdb4bd18b6e188ee603cd59a24854275f9	[-0.005114721,0.021696752,0.04743415,0.0060877,0.059875306,0.00939782,0.029722815,0.043623857,-0.0526016,-0.090273544,-0.017445605,0.016511928,-0.050386593,-0.0005638459,-0.07541405,0.012924982,-0.051309947,0.01610376,-0.03200621,-0.03272917,-0.02037067,0.007446856,0.023187777,-0.004125923,-0.0023791236,-0.07741688,-0.0023455885,-0.017507166,-0.04107335,0.19233552,0.0060214256,-0.028444242,0.047577705,-0.02366118,0.016225891,-0.02930934,-0.019611835,0.011133883,-0.034652613,0.03775032,0.0045173005,-0.0134107815,-0.025403282,-0.01464478,-0.026578005,-0.011812353,0.0002488303,-0.0021661294,0.0076014213,-0.03467614,0.027211173,-0.051156342,-0.00021706936,0.026984947,0.0044573997,0.02862575,-0.012941799,0.007554244,-0.0005692147,-0.007436797,0.0037339889,0.028944178,0.037204914,0.001829061,0.03790142,-0.01411411,0.014661306,0.0006490559,0.013500592,0.03164468,0.040062226,0.020292422,0.011005288,0.0010786817,-0.05307837,0.038034,0.02375676,0.017317643,0.017132523,-0.011063236,0.00058103947,0.057463355,-0.006078032,0.0066882283,0.024170486,-0.0168351,-0.012405288,0.03167056,-0.011704492,0.029032156,0.03302062,0.0503679,0.012303625,-0.009464036,0.012936912,0.020312065,-0.021868564,-0.0031383233,-0.007788718,0.021644982,0.005238941,0.013377343,0.03469002,-0.007436366,0.012455374,-0.027428744,-0.01975129,-0.016609488,0.029234143,-0.010672513,-0.022407368,-0.24129322,-0.009824277,0.00531815,-0.04682661,-0.016061125,0.004406274,0.039066076,0.072989695,-0.009496417,-0.008772203,0.008287232,0.018562235,-0.00568411,0.0028289063,0.0032825621,0.000439266,0.033313647,0.02070804,-0.025901923,-0.03412627,0.005051633,0.02457069,-0.02374595,0.009189359,-0.011102311,-0.030015644,0.005205825,0.03360558,-0.031501528,-0.044976737,-0.00038503605,0.026854115,0.02124365,0.018124213,-0.0018712565,0.047532417,0.020220404,0.050285615,0.017200552,0.021602299,0.018781751,-0.016138963,0.018271156,-0.020899799,-0.02968616,-0.005803821,0.0005053027,-0.0051232586,0.041706964,-0.018661987,-0.009563826,0.005179471,0.025011541,-0.04494006,0.00037215676,-0.028485319,0.0052436795,-0.027018085,0.01723101,-0.037418187,-0.026191121,0.0025766445,0.0073647755,0.023328265,0.02128353,0.004339338,0.011499764,0.048348002,0.029540084,-0.005970359,0.021083033,-0.077952474,0.026799355,-0.0030509806,0.0038874883,0.042679448,0.012213383,0.013472986,0.019318668,0.012983923,0.024391575,0.03003791,-0.027846124,0.026256397,0.008996176,0.009923053,-0.08011787,0.064478636,0.0067285583,-0.002326592,-0.008344378,0.05314329,-0.022129256,0.0045181285,0.04280877,0.0025585073,0.04483269,-0.022729702,-0.079219356,-0.01206184,0.02623542,-0.009858325,-0.05666127,0.01701954,-0.04366663,-0.007306224,0.0017363055,-0.030396951,-0.037836682,0.04386029,-0.033177968,-0.015099399,-0.015580978,0.027295457,-0.010695604,0.02627786,0.007950612,-0.00053292775,0.032428727,-0.048957657,0.001856692,-0.002874398,0.014506264,-0.059146374,-0.03900752,0.02875617,0.026845114,0.017420175,-0.06150475,-0.010830482,0.008921483,0.014768789,0.013934213,-0.018871427,-0.010486733,0.022139562,0.0348694,-0.030133454,-0.054472473,-0.032133583,0.0145776495,0.025950486,0.0031755518,-0.026627656,-0.017536318,-0.008365819,-0.015425889,0.010572813,-0.020612784,0.05366718,0.009181937,-0.015859941,-0.008161405,0.045089405,-0.02453214,-0.016032353,-0.04108618,0.01672466,0.000712492,0.0052255294,0.04205581,0.017167501,-0.020783886,0.0070493743,0.058018927,0.0018306646,-0.005392377,0.019808985,-0.029186808,-0.004446596,-0.007044551,-0.033002574,0.022142133,0.034465373,0.07434724,-0.032758486,0.033577327,0.039579537,0.020531707,0.03811755,0.05294126,-0.004327014,-0.0063216793,0.0010980275,0.013517571,-0.0101814605,-0.010128676,-0.03528423,-0.012721161,0.0072985105,-0.00883995,0.033739783,0.03454791,0.034066662,0.012763167,0.016100908,0.0083386125,-0.052721493,0.018854855,-0.04886704,-0.01325592,-0.038246308,-0.032954678,0.004961754,-0.040234055,-0.060074747,0.0033361681,0.0009083067,-0.16288202,-0.008124387,-0.027644206,-0.037779056,-0.012282159,-0.021006031,0.013587858,-0.0083976295,-0.069421865,-0.043460336,-0.050219975,0.011302489,0.031987242,0.0639549,-0.01629258,-0.046300367,-0.018433033,-0.002352194,0.021522526,-0.018571105,0.04499013,-0.017655673,-0.2781866,0.02352779,0.040877152,0.052473053,-0.019038849,0.00071128487,-0.0018718387,0.0066265673,0.03913839,-0.009689421,0.034477636,-0.04232838,0.06317372,-0.030852303,0.062070236,-0.03873125,-0.015772386,-0.05086376,-5.2328724e-05,-0.014608389,0.015000443,0.0007848037,-0.028602913,-0.057814173,-0.017645922,-0.03034563,0.032342006,0.05120165,0.03347294,0.018162264,0.05103821,-0.028914211,-0.0007474643,-0.0052039665,0.04036225,0.008827877,0.02545132,-0.005748227,0.004567112,0.0621717,-0.0263774,0.0206292,0.022441752,0.031682257,-0.0026033656,0.0026459189,-0.00963904,0.021540256,-0.04792762,0.00036109754,0.071210146,-0.04959074,-0.007482558,0.037205286,-0.035168,0.008974082,-0.04691295,0.016140165,0.020819953,-0.010231287,0.008180408,0.017490054,-0.010400265,0.009951288,0.0452821,0.03706653,-0.022439513,-0.0069828467,-0.054984316,-0.047266137,-0.0583229,-0.0040629827,-0.018327849,0.010772627,0.018304382,-0.06914391,0.107739195,0.013541713,-0.021346409,0.010529956,0.024657497,0.014815404,-0.032209054,-0.020441255,-0.0394267,0.027686188,0.0053789387,-0.027336784,-0.008884,-0.07351813,-0.06526902,-0.05033713,0.014528609,-0.011915192,0.0205926,-0.027524823,-0.033151653,0.022440778,-0.043602813,-0.027318839,-0.024307426,0.021726562,-0.022501515,0.05599481,0.016040962,-0.0061930376,0.0024194026,-0.025823621,0.020981906,0.022438556,-0.04777456,0.009336178,0.020033335,0.057410706,0.014359848,-0.03585775,-0.009166355,0.0066692135,-0.057730503,-0.04391059,-0.011374066,0.016739339,0.008989447,0.021260329,0.016412986,-0.008234415,0.008424451,0.071701534,-0.02134173,-0.008100406,0.015300452,0.055978257,0.019522127,0.023863202,-8.007702e-05,0.031303234,-0.0032624672,-0.01632684,0.002452352,0.005044786,0.012425965,0.023660358,-0.014202354,0.024160977,-0.003717674,-0.01312924,0.029745508,0.0337351,0.0285997,-0.004204731,-0.008646785,-0.07458208,0.013325282,0.044084027,0.0024332171,0.0017485624,-0.00040509933,0.008650197,-0.063255094,0.064166225,0.027400294,-0.07971854,0.01900632,0.027037552,0.009856611,-0.011934085,-0.23234567,-0.03690779,-0.004228924,-0.015499348,0.03152845,-0.041949976,-0.021638311,0.022188742,0.0038608317,0.009786581,0.053121343,0.013502601,-0.02357162,0.045186944,-0.0059105977,0.015642315,-0.0134498365,0.001365365,-0.053426288,-0.026312375,0.028591696,-0.059759576,-0.05374219,0.01954409,0.016187266,-0.066907436,0.039821163,-0.04033594,-0.029169844,0.002935676,0.027046688,-0.02978595,-0.031772524,0.02657084,-0.009744621,-0.016963912,0.05839009,-0.040173534,0.010470164,0.009759201,0.011787365,0.035631377,-0.030629266,-0.01798548,-0.010063933,0.005759175,0.0129132075,-0.12409343,0.0072166002,0.04223684,-0.019425454,0.043996047,-0.015201608,0.031053279,-0.026747713,0.02279678,-0.009446531,-0.0075017293,-0.011429309,-0.018164162,-0.0012973187,-0.05291412,0.002227167,-0.017339727,-0.015568134,0.006573518,0.022375386,0.14164597,-0.030241732,0.046636514,0.006875153,0.04133734,0.030114189,0.045236554,-0.0076026316,0.048733946,0.06562184,0.048361026,-0.00082396524,0.046083488,-0.009794235,-0.01713042,0.005511003,0.0056456984,-0.007422392,0.0745085,-0.017356006,-0.029152293,-0.014457501,-0.0054669934,0.021925222,0.01129699,0.028395435,0.0009709217,0.0038988197,0.032345783,0.000101543825,-0.02399966,-0.039892968,0.01946181,-0.07520303,0.0066544926,-0.018274318,-0.010578715,0.029958904,-0.04607675,0.02921005,-0.04208771,0.022333514,0.028973857,-0.01654167,-0.005617295,0.02623033,-0.05811552,0.04335417,0.00038366183,-0.016776673,0.0028041615,-0.05590157,-0.025937011,-0.013438552,0.019042937,-0.004895304,-0.02843748,0.0004470244,-0.0099193705,0.027402015,0.009408898,-0.02054363,0.082135506,-0.0009243783,0.0071253693,0.018131295,-0.054303166,0.042639863,-0.029918933,0.048284184,0.03282772,0.019363713,-0.05158017,-0.00074513187,-0.024256578,-0.008271811,0.019695323,0.05747112,-0.056795385,-0.034568574,0.041579597,0.017009998,0.021611694,-0.009988729,0.016484529,0.014484026,0.0059064426,0.030764312,-0.034487396,-0.016783591,0.059391774,-0.028360376,-0.029119415,-0.021742858,0.0388443,0.014067937,-0.034102242,0.0016150309,-0.035023022,-0.017912697,0.0054721194,0.058315482,0.029255535,0.002119562,-0.03377413,0.021152765,-0.005294433,0.012994347,0.036939096,-0.008969966,0.013443885,-0.012026659,-0.009309959,-0.008982499,-0.0070792106,0.014670704,-0.034234527,0.03761075,0.048862223,0.00728091,0.008301832,-0.022794548,-0.0035780857,-0.011632825,0.010555932,-0.045341667,0.048744448,-0.016223677,0.013752318,0.030642353,0.09719075,-0.005029474,-0.022730758,-0.021298675,0.027713675,0.013343807,0.05007882,-0.06318033,0.024800776,-0.056750227,-0.004367842,-0.029589128,0.049995165,0.033013288,0.030750604,-0.012650605,0.013280453,0.017244508,-0.012700595,0.009751949,0.0004843037,0.02527455,-0.04509892,0.0027983508,-0.029898388,-0.011730547,-0.018959377,0.005368086,0.093663685,-0.045524724,0.038786434,-0.05066808,0.002527029,-0.07143054,-0.03918725,0.00701562,0.024433274,-0.0617841,0.021838488,0.009582598,0.0073129577,-0.018414859,0.06985418,0.019257644,0.024597706,0.013910928,0.004874941,-0.0129525205,0.0059850635,0.017911281,0.02066716,0.022703262,0.001142791,0.0013919871,0.008073916,0.0188479,0.029087877,-0.051027156,-0.029571043,-0.04502324,-0.0041667838,0.018127415,-0.010101893,-0.012887644]	2026-09-08 09:32:54.310023+00
9	school_info	9	0	Maktabga qabul	Maktab haqida — Maktabga qabul\n\nBirinchi sinfga qabul har yili 1-iyundan 25-avgustgacha davom etadi. Hujjatlar ro'yxati: bolaning tug'ilganlik haqidagi guvohnomasi nusxasi, ota-onaning pasport nusxasi, tibbiy ma'lumotnoma (086/u shakli), 6 dona 3x4 o'lchamdagi fotosurat. Hujjatlar maktab kotibiyatiga ish kunlari soat 09:00 dan 16:00 gacha topshiriladi.	/about	f6aa965aca295a3b47909873610a603e2f8f34fc3f90840947a458c92ceecf48	[0.03509027,-0.012956221,0.019577902,-0.011182566,-0.0013990246,0.0051930267,0.034189664,0.011445274,0.03638323,-0.10163559,-0.010389543,0.031168986,-0.035279814,-0.01747531,-0.009383146,0.02538559,-0.020236459,0.01389554,-0.011660403,-0.031505357,0.012629894,0.020562883,0.029759992,0.028334258,-0.030191131,-0.011352072,-0.015137948,-0.04954739,-0.009249891,0.19063526,-0.0061384384,-0.007347299,-0.00413821,-0.089626715,0.020931138,-0.015465749,-0.009062313,-0.026773993,-0.018893039,0.021479683,-0.011606353,-0.03423247,-0.03714254,-0.024971705,-0.05021403,0.0018199264,0.0032126962,-0.0012203298,0.042764977,-0.011173421,0.056083314,-0.014569349,-0.00025214418,0.007869082,-0.03293224,0.03125049,-0.015889112,-0.0067923595,0.01751452,0.004095869,0.026992835,-0.00055097305,0.029703397,0.027813202,0.028238798,-0.013102439,0.007397696,0.0025719635,0.004782735,0.04133022,0.0012945496,0.040942762,-0.02047825,0.020812318,-0.010064428,-0.0189725,-0.006459235,0.009347933,0.007408523,0.005149853,0.021519482,0.036669604,-0.032768406,-0.02224832,0.013899356,-1.0389693e-05,0.016120736,-0.0052672983,0.016869804,0.017955692,-0.0046669845,0.0065793777,-0.0062959674,0.00037285686,0.038245317,0.03783353,0.010377894,-0.02153931,0.050356764,0.046468783,-0.019122733,0.07877119,0.024893591,0.025276275,0.042717095,-0.014678562,-0.014631057,-0.014981567,0.02710165,-0.0002879238,0.005355366,-0.29271623,0.018434586,0.053170383,-0.061068267,-0.03393885,0.014444481,0.06262808,0.054224063,0.047363687,-0.009861201,0.02505711,0.011982031,-0.02867636,0.018561238,0.019279674,0.029488865,-0.0015557521,-0.016621333,0.010622167,-0.044710454,0.047528177,0.01340281,-0.035610694,-0.030650051,-0.025749106,-0.028152218,-0.0009817174,0.010451816,0.002687067,-0.01637705,-0.03545225,0.009636415,0.010088411,-0.03362441,0.03825072,0.0035563742,0.007988781,0.02535876,0.019353662,-0.019061688,-0.0017626463,-0.013212599,0.014751946,-0.008083127,0.0032195328,0.019982029,0.007496123,-0.025790928,0.05405003,0.007043158,-0.0023490116,-0.021343872,0.010581222,-0.047383297,-0.0064048804,-0.022989191,-0.011452409,-0.06727021,0.02785775,-0.036137305,0.027186193,0.0015815583,0.012437446,0.0009113763,-0.008515762,0.03396004,0.042436346,0.00809493,0.039936908,0.025610402,0.0032631129,-0.058916163,0.03596755,-0.00723539,0.00014183055,0.049249213,-0.030583413,0.019755254,0.026115187,0.019557217,0.022938868,0.017314335,-0.020204736,0.041532192,0.006593321,0.014595338,-0.0043041334,0.051823527,-0.023100892,-0.0010479086,0.037075058,0.038027294,-0.007276004,-0.0018385531,0.038879853,0.007587666,0.038015954,-0.015794424,-0.024325969,0.015626425,0.0048230346,-0.014614935,0.014754515,-0.035010453,-0.018544607,0.016307762,0.030883951,-0.0124505,-0.020278294,0.009232651,0.011219481,0.012987116,0.011751801,-0.017935574,-0.029555207,0.052004803,-0.010868748,0.03240535,0.0012051916,-0.015835695,0.0023405058,0.031526543,-0.03058388,0.023335854,-0.019854857,0.02605806,0.025669819,0.047433015,-0.01968552,0.006810007,0.007899534,0.014288084,-0.011003331,-0.00050405774,-0.018238898,-0.0012212723,0.011720408,-0.039785344,-0.0507454,-0.011750081,0.01420561,-0.018004581,-0.02401328,-0.0073271063,0.014734178,0.009109604,-0.0069321087,-0.003333496,-0.062214747,0.0030521522,0.01322925,-0.036241252,0.004171798,0.03762465,0.0077993725,0.01805625,-0.07331581,0.02618263,0.004417745,0.004118044,0.06267062,0.010273719,-0.057226945,0.019704923,0.05034914,-0.018695688,-0.02051838,-0.052277815,-0.021375434,-0.01673781,0.020922486,-0.0134227285,0.019172665,0.03283758,0.048193082,-0.04874506,0.01269132,0.022810664,0.024612753,0.034961298,0.024044728,0.026472567,0.0263017,-0.0057003126,0.021678036,0.00084213173,-0.054862823,-0.030649098,-0.015173401,0.0048079863,-0.027834507,0.022752378,0.008594883,0.039356463,0.01858589,0.017287688,0.010010345,-0.0045128316,0.0022414722,0.0034382308,-0.0006055524,-0.009712209,0.0076823416,-0.0109859025,-0.017825643,-0.035307735,-0.020060929,-0.006448254,-0.19384827,0.015217978,-0.011386386,-0.007898386,-0.062054154,0.0033294018,-0.005195098,-0.02713261,-0.039294925,0.016093384,-0.020370452,0.012308894,0.020686222,-0.004764033,0.0507856,-0.030793147,-0.014886459,-0.016156247,0.016329693,-0.004496468,-0.016780825,0.016110921,-0.32891858,-0.00024858408,0.05810154,0.037544526,-0.051399507,0.0021016018,-0.004458283,0.036367,0.026017837,-0.018777309,0.04137393,0.010910287,0.026896337,-0.023501657,0.04763574,-0.00078239397,-0.011621995,-0.011075374,-0.019293971,0.013427933,0.003163963,0.013243336,-0.007039472,-0.010810519,-0.023307303,-0.004701198,0.034088522,0.0037349972,0.016094204,0.015399206,0.005400938,0.04287224,0.05714072,0.0005205892,0.008653675,-0.00367742,0.029118208,0.024311434,0.01745235,0.0032712605,-0.029208688,0.027548006,-0.008623163,0.0305311,0.020890288,-0.004456988,-0.01041743,-0.00917653,-0.045569032,0.030391002,0.06642116,-0.027653266,-0.024307463,0.01598209,-0.035048075,-0.023380926,-0.039124835,0.016024811,-0.004366466,0.043009505,0.0063218395,0.04127083,-0.023470864,0.017321665,0.028310392,0.03256356,-0.009965406,-0.055777233,-0.044080943,-0.0357766,-0.03701999,0.02333978,-0.005855878,0.0311766,0.014607865,-0.0607926,0.1055293,0.016601035,0.015195638,-0.023848176,-0.018325703,0.016410133,0.011666157,-0.0029061274,-0.023461048,0.0071391864,0.0175255,0.0018346647,0.048409484,-0.01961169,-0.028820472,-0.04109935,-0.0039514233,0.015325968,-0.028483951,0.004883739,0.0036373637,0.048556656,-0.03265784,-0.032872055,0.0076295882,-0.010090266,-0.0337908,0.010506862,0.032591447,-0.0012437904,0.033537626,-0.018036967,0.024165893,0.06061305,0.009170107,0.01769691,0.03915528,0.0008188819,-0.025249587,-0.008219013,-0.017812379,-0.014326737,-0.030621279,-0.02119438,-0.014742757,0.00025928955,0.013218651,-0.0036808331,-0.044142112,-0.048234686,-0.02025454,0.045433775,-0.03253296,-0.026366439,0.01758777,0.004336514,0.046660848,0.040238302,0.010456141,-0.01578514,0.0224943,-0.0112944245,-0.00015881455,0.015727099,-0.023204206,0.028562991,0.016718091,0.009927886,-0.03544564,-0.0039801192,0.06120745,0.06763876,0.00015257989,-0.0016936436,0.0020340623,-0.055794243,0.03286778,0.04436133,0.015815519,0.0013133931,-0.018890958,0.0340871,-0.019571442,0.02270495,-0.017547186,-0.078510754,-0.0058749877,0.041311692,-0.0012198953,-0.023170546,-0.27542913,0.011253412,0.045551788,0.03642575,0.032913387,-0.015300912,-0.025490306,-0.07477022,-0.019175084,-0.053811513,0.01959234,0.002178566,-0.0431766,0.059611075,-0.0043745567,-0.0074895252,-0.023892876,0.014591459,-0.07293769,0.0017711757,0.019817544,-0.050801244,-0.00716047,0.017145757,0.0012959249,-0.060623676,0.0022257236,0.0063358014,-0.016070046,0.021849746,-0.049638223,0.029319223,-0.020781398,-0.0056643602,0.0077882307,-0.053399753,0.042368766,-0.06932616,0.007921688,0.012672613,0.0076564807,0.0732492,-0.009718962,-0.008551638,0.006826322,-0.026547704,0.046760306,-0.112711035,0.020943446,-0.011567376,-0.010617595,0.04571415,-0.07652665,0.008422767,-0.019624025,-0.017999016,-0.029487144,-0.03158755,-0.022155909,-0.019230135,0.064077474,0.0027795495,-0.0052082026,0.007942723,0.033464536,0.07063462,-0.002443255,0.14206217,-0.022771437,0.004533602,-0.008128376,0.058281258,-0.0031739932,0.003962339,-0.018502519,0.02499457,-0.020381825,0.029922599,-0.031843428,0.02574679,-0.035183266,0.0037132103,0.018400878,-0.011784484,0.014670351,0.064835384,0.014319864,0.02700652,0.0042288937,0.007077791,0.035800602,0.025449278,-0.0017708672,0.028243318,-0.028323716,0.03640448,-0.005080547,0.020169273,0.0050487584,0.048501898,-0.05951322,0.020477863,-0.020474456,0.0025723847,0.02397851,-0.0011684404,-0.002408352,-0.007883831,0.041776996,0.031533685,-0.013885343,0.0028524117,0.029734535,-0.040505074,-0.0036294023,0.0028803137,-0.02396442,0.022355037,-0.05283725,-0.022543613,-0.02468627,0.0038857316,-0.022300532,-0.038771722,-0.020088116,-0.042990137,0.020006541,-0.026043601,-0.017927784,0.07145085,-0.046609018,0.011632543,0.01563541,-0.019102298,0.025818253,0.007811417,0.01043536,-0.021166962,-0.0131199295,-0.02816819,-0.0032724799,-0.029698413,0.0099362265,0.030535875,-0.00088142225,-0.046753146,-0.01878931,0.022792382,0.030448554,0.0052838586,-0.043000046,0.0058378014,-0.0062349066,-0.040316846,0.041046336,-0.012916194,0.014463113,0.007525306,-0.00829023,-0.01551617,0.028751457,0.0029998277,-0.0058272514,-0.006280254,0.028081797,-0.00694458,0.007152727,-0.023541244,0.029757418,0.012290144,0.007183432,-0.007251018,-0.022781527,0.015140016,-0.013567831,0.039443657,-0.0070820358,0.03801211,-0.00952633,-0.0097145755,0.010345921,-0.040152926,0.0068118786,-0.004426241,0.026178151,0.056134064,0.0020381263,0.015158226,-0.027456822,0.024533004,-0.031778768,-0.0014548008,0.0005992578,0.06800761,0.0066346233,-0.03143091,0.03478827,0.050552756,-0.008930516,0.016825208,-0.04999532,-0.008928317,-0.0218146,-0.0031940457,-0.057161007,0.0393411,-0.0058536874,0.00857329,-0.016759975,0.043025754,0.024632951,0.03801949,-0.007298128,0.01778083,0.0008809029,-0.0024128703,0.043885317,-0.0020495413,-0.016003225,-0.016042259,-0.039377052,-0.03552764,0.011725624,-0.023297394,0.0080906525,0.08308401,0.0058175987,-0.012488649,-0.08702561,-0.029124968,-0.037240546,-0.030609543,-0.007348843,0.03353683,-0.04519044,0.032892715,-0.00742214,0.05471951,-0.00042241038,0.0018804212,-0.032526016,0.035754245,0.04024445,0.009473773,-0.028969895,0.0058376715,-0.049604684,0.052291427,0.03620846,-0.013210525,-0.03134824,-0.008982249,-0.04606586,-0.0219257,-0.049702935,-0.0063686697,-0.026567824,-0.028362636,0.00017953185,-0.0027225795,-0.033941433]	2026-09-08 09:32:54.310023+00
10	school_info	10	0	Maktab formasi	Maktab haqida — Maktab formasi\n\nO'quvchilar uchun maktab formasi majburiy. Yigitlar uchun: to'q ko'k kostyum, oq ko'ylak, galstuk. Qizlar uchun: to'q ko'k sarafan yoki yubka, oq bluzka. Sport darslari uchun alohida sport kiyimi talab etiladi.	/about	98e9f6d0c074b5ed12014d049b9c062916a6fcca632151c963d854213291fbec	[0.028023966,0.010020211,0.048926186,0.02574058,-0.005711543,0.0041690487,0.031955894,0.008513255,0.0069717057,-0.08792271,-0.04767949,0.03468623,-0.030356308,-0.02587929,-0.012116502,0.0009795938,-0.036165774,-0.00039605342,0.04363185,-0.01087355,0.025620593,0.015324054,-0.00288803,0.00439924,-0.00026669505,-0.019587029,0.033122838,-0.036738772,-0.02242107,0.20027366,-0.0031317656,-0.0454114,0.01633715,0.0049071275,0.03398067,-0.011139585,-0.017520934,-0.046895407,-0.035866853,0.04248985,-0.028544528,-0.017712004,-0.021811409,0.0012538134,-0.012392602,-0.006063309,0.0013458106,0.008666901,0.04111475,-0.006572321,0.046933975,-0.019973524,0.027039759,0.008693036,0.008999626,-0.019447055,-0.038993817,-0.01746778,0.0068400158,0.01011392,0.018343491,0.0034748174,0.037951477,0.02075786,0.018363325,-0.017576637,0.0047213603,-0.02312024,-0.03461187,0.0084080845,-0.011784189,0.025610933,-0.007192933,0.05210291,-0.047412314,-0.040862218,-0.00896079,0.0017058374,0.02192217,0.02597744,0.021786055,0.04138785,-0.020607363,-0.024114586,-0.007978716,-0.024636516,0.0035637754,0.015605031,0.016810222,0.043460194,0.033949908,-0.03402046,0.0055045327,-0.024606328,0.0038444658,-0.0003888305,0.009651703,0.03156924,-0.016677598,0.051094625,-0.022223916,0.036438137,0.03922074,0.021851387,0.017479885,0.013261587,0.003026903,-0.007556743,0.05637312,0.03535412,0.01636937,-0.2760388,0.008192781,0.04434781,-0.040419474,-0.04972788,0.021935029,0.03269088,0.06360795,0.0022158572,0.01675657,-0.009307011,0.014816729,0.01766553,0.016809113,0.0391932,0.029503565,0.06799825,-0.03656892,0.010610932,-0.011438163,0.030149134,-0.027067324,-0.022160485,0.0049832,-0.014061538,-0.032939408,0.00071710284,-0.0043913573,0.02329059,-0.051793873,-0.025686687,0.03442877,0.0010002877,-0.0114914505,-0.012434321,0.036931053,-0.008404675,0.048462044,0.021785917,-0.01920124,0.015517282,-0.016199378,-0.002070856,-0.002805117,-0.005249787,-0.021451438,0.0032463465,-0.011939061,0.08780034,-0.019984404,0.009576946,0.01320591,0.01623547,-0.033333346,0.018041352,-0.03246817,-0.000618321,-0.07309566,-0.031401012,-0.04409156,0.021641541,-0.018182024,0.038781323,-0.012937348,0.0053297337,0.020499086,0.01935997,-0.0039977464,0.03442259,0.024932757,-0.023462165,-0.072764166,0.013822456,0.011367808,-0.060540907,0.04388724,0.0053549698,0.0066119917,0.008476454,-0.003062193,0.048742473,0.01735756,-0.012993097,0.02333648,-0.00025550637,0.012247987,-0.012382321,0.028977556,-0.027950993,-0.011158776,0.0015847305,0.024037804,0.0061568017,0.008137274,0.007985729,-0.0074663423,-0.008437707,0.00086442777,-0.03471006,0.012120109,-0.018373247,0.020907482,0.0077208895,-0.01788665,-0.005104421,0.047772236,0.038347088,0.0007020756,-0.0006288131,0.030824712,-0.03914877,0.012155688,-0.025930833,-0.039556336,-0.050827056,0.002879905,-0.009210234,-0.00542752,0.010850377,0.002477018,0.026769025,-0.0052419407,0.0071090357,0.0046029985,-0.03018848,0.01955502,0.04796312,0.03620522,-0.033593614,-0.011207703,0.034901574,-0.023079416,-0.009329739,-0.010499847,-0.051956866,0.014109619,0.010611572,-0.020875504,-0.07748976,-0.04541124,0.0035964025,-0.0035022576,-0.015788345,0.00067244057,0.034098353,0.042679377,0.0103868125,-0.011005755,-0.008657551,0.00017738501,0.016744021,-0.017460937,0.011424913,0.050235808,0.015403636,0.010269372,-0.07814012,0.0022824581,-0.012937577,-0.0050355652,0.059405994,0.01873138,-0.050758883,0.007540689,0.023988236,-0.009997526,-0.0033386094,-0.04283257,-0.019715177,-0.027499726,-0.006866954,-0.014407837,0.027510662,-0.0040081274,0.014531952,-0.038328838,-0.0077961,-0.0054556075,0.006972348,0.059003655,0.03225689,0.01062337,0.015774189,0.012130695,0.032006122,0.029843288,-0.022746233,-0.025535543,-0.0025788958,0.013756229,0.0001967316,0.04259499,-0.008810927,0.014526736,0.03270304,-0.018191596,0.025567787,-0.04534055,0.03659485,-0.029768588,-0.03258408,-0.043739583,-0.025648529,-0.011850373,0.018853065,-0.011578537,-0.027040822,-0.0117289545,-0.21525799,0.023955612,-0.031690646,0.002773429,-0.06702691,-0.0010800657,-0.042502236,-0.025613056,-0.018267458,-0.03420438,-0.050125208,0.00886105,0.012835565,0.017103234,0.008848504,-0.030662993,-0.020358656,-0.019668588,0.0006795955,-0.009697687,-0.028551,-0.00040190917,-0.3201441,0.010230773,0.030519895,0.020309266,-0.016547045,-0.01626183,0.03525625,0.016869357,0.0029178066,0.02028478,0.020019611,-0.010833274,0.011767138,-0.018899368,0.048136726,-0.021499282,0.012313733,0.012461018,-0.040027637,-0.011919682,-0.0030848105,0.035599496,-0.008215477,-0.004573639,0.004223933,-0.049765855,0.024107512,0.016822597,-0.019398207,0.04237702,0.0004489502,0.027014073,0.040349565,-0.021009618,-0.021990962,-0.02455446,-0.006537801,0.0060238787,-0.024797447,-0.0019172325,-0.062800124,-0.007603455,0.00044012125,0.06605472,0.04795229,-0.01232903,0.008390139,0.014047516,-0.03692358,-0.0010219646,0.09083114,-0.012446391,-0.019391663,0.019573862,-0.039595824,-0.0026112762,-0.0484539,0.0073739807,-0.015419199,0.0038467029,0.024553264,0.04856416,-0.023623856,0.030020487,0.025554523,0.0528356,0.012600469,-0.03659079,-0.039131496,-0.036926083,-0.048589386,0.053252615,-0.001928112,0.02007328,0.029092455,-0.04921514,0.09587826,0.010913489,-0.017180953,-0.0076289778,-0.009843487,0.026510695,-0.019267917,0.03316875,-0.025908487,-0.016747167,0.011355161,0.0016015789,0.011598102,-0.032304984,-0.026776623,-0.006603264,-0.027518798,0.018649815,-0.034257356,-0.023166822,-0.042415768,0.03523326,-0.016462589,0.010816448,0.022509944,0.017538212,-0.07407133,0.024411563,0.010595637,-0.037952922,0.017315315,0.0021241722,0.026669255,0.04814284,0.020255126,-0.013687572,0.020932682,-0.02409684,-0.0052975053,0.012453537,-0.056682687,-0.030135542,-0.03293263,0.0059129144,0.03736362,0.015718658,0.006178177,-0.010787378,-0.018722527,-0.022156069,0.017075034,0.06856701,-0.059880704,0.034511983,0.0025753584,0.039626233,0.0425484,0.010511538,0.0102258865,-0.0024804303,0.0032625513,-0.019839006,0.0015406566,0.022760693,-0.027702248,0.025691124,0.020254653,-0.010481784,-0.043204185,0.03591523,0.004990887,0.042835247,0.025501726,-0.014169525,-0.0043792916,-0.03015199,-0.008635052,-0.014019627,-0.008800899,-0.017082317,-0.00062404707,-0.0072138547,-0.017091297,-0.015717758,0.037527528,-0.060957033,0.03200937,0.04984503,0.019283904,-0.024537118,-0.285179,0.035217687,0.030116891,-0.008411454,0.03464385,-0.032082167,-0.014832609,-0.016635055,0.019606,-0.011981439,0.008066639,0.009407621,-0.04673247,0.025924867,0.022979585,-0.019441085,-0.03442617,0.0026342082,-0.038638014,-0.022683574,-0.020782897,-0.04466752,-0.002445307,-0.012351838,0.041360803,-0.060609,-0.020318937,-0.011041408,0.0018566423,0.018027076,0.0149532305,0.035293933,-0.002448299,-0.042957053,0.024157172,-0.028195394,0.060591996,-0.049332906,-0.0038396174,-0.0056400993,0.015263609,0.029112034,-0.013758427,-0.022077225,0.013960953,0.012157174,-0.0086060725,-0.11051314,0.009781237,-0.038905513,-0.014308937,0.016944436,-0.015994787,0.041862972,-0.020325053,0.019757463,-0.041352093,-0.04468672,-0.028286116,-0.021520648,0.027649652,-0.012671553,0.0014414883,-0.0036309767,0.053041264,0.040695433,0.0064418744,0.16956042,-0.034760326,0.013566016,-0.027982632,0.004465131,-0.026997434,-0.031225538,-0.01600323,0.014214683,0.036510102,0.023706168,-0.031296644,0.024082337,-0.019292658,0.018431708,0.056899738,-0.013082338,0.008054649,0.027532287,0.014994398,-0.024648774,0.004143785,-0.0038937745,0.020765487,0.019175876,0.04923544,0.018432764,0.013783448,0.012142519,-0.011976162,0.0064786216,-0.011135863,0.024337357,-0.09470007,0.017273683,0.017910857,0.0021841186,0.025752796,0.0050734617,-0.020644618,-0.01356988,0.026251843,0.013685912,-0.020333134,0.011904015,0.029171515,-0.013736647,0.028668558,0.014715861,0.0012707723,0.041212376,-0.055062756,-0.019008849,-0.0010154567,-0.007023794,-0.004409489,-0.03650324,-0.032087862,-0.0083508855,0.025267223,-0.021073602,0.003846844,0.053166527,-0.023827607,-0.015517346,0.040600143,-0.010905046,0.04350237,0.00044554123,0.061203834,-0.056542717,-0.025657166,0.0069793286,-0.035558514,-0.03758209,0.02498261,0.00476732,0.01572227,-0.00784449,0.035904158,0.062163293,0.02140033,0.061631355,-0.016252056,0.02716082,-0.017066283,0.02159035,0.039903425,0.003990902,-0.0047065704,0.00027081245,-0.038534023,0.0031509,-0.0037548672,0.0051250192,-0.03370138,-0.009179658,-0.0036870653,-0.025426194,0.015278654,0.0028170492,0.053183135,-0.02517355,-0.007957401,-0.00024503737,-0.013221292,-0.013257021,0.01577118,0.014787925,-0.023665467,0.04795608,-0.020642051,-0.012234034,-0.04402814,-0.008603752,0.0020928811,-0.01217828,0.041208718,0.07695263,-0.007304864,-0.0025594248,-0.039656725,0.0084005995,-0.0035022853,0.0279625,-0.015811933,0.061461635,-0.021865832,-0.03981804,0.0073940395,0.01887926,0.015461792,-0.020286446,-0.03190442,-0.025989536,-0.01049746,0.007375894,-0.06361985,0.025591685,-0.0062292516,0.016912568,-0.022301577,0.027443282,0.001150073,0.002574603,0.026470518,0.021038067,0.019273631,-0.028581666,0.048847176,-0.03333744,-0.00719232,-0.02531853,-0.0151995,-0.061427355,0.030344617,0.020127406,0.015903337,0.09573713,0.04989013,-0.016845316,-0.03728264,0.01482704,-0.028405223,-0.004063987,0.049355246,-0.013549756,-0.018766677,0.045951743,0.00014644838,0.014939451,-0.029536352,0.015058514,0.0028329692,0.03797527,-0.018572971,0.010738432,0.038422327,-6.7345777e-06,0.0024792103,0.036742568,0.042474274,0.0004570006,-0.033012394,0.018051857,-0.027829254,0.010117049,-0.06385547,-0.023692595,-0.038416114,-0.007279802,0.0017278158,0.021836422,-0.013684823]	2026-09-08 09:32:54.310023+00
11	school_info	11	0	Ovqatlanish	Maktab haqida — Ovqatlanish\n\nMaktabda 1-4 sinf o'quvchilari uchun bepul issiq ovqat tashkil etilgan. Oshxona soat 10:30 dan 14:00 gacha ishlaydi. Yuqori sinf o'quvchilari uchun bufet xizmati mavjud.	/about	76dcce23b66894bf68d68f87e80cfa13fbc160f84efef93889a8b45f462030ff	[0.016814658,-0.01725199,0.021841759,-0.023457833,0.01946239,0.015464611,0.046363194,-0.031569354,0.03881867,-0.089184806,-0.022569405,-0.0035322744,-0.024770485,-0.01910527,-0.042738218,0.054328308,-0.019017696,0.012800106,0.012227118,-0.014902624,0.011509965,0.0034070117,0.038825147,0.0037397405,0.0057436926,-0.015215649,0.022770898,0.002670444,-0.041517753,0.2375742,0.049995497,-0.020322876,0.0070529655,-0.0092913,0.03956812,-0.029213933,-0.030968605,-0.032028295,-0.040620223,0.00573687,-0.036886618,0.008489065,-0.043684453,0.0028981157,-0.025897592,0.031739566,-0.037273195,0.013028747,0.030842623,-0.0269183,0.04009921,-0.04196808,0.035429988,0.008387627,-0.021534631,0.026740016,-0.010869937,-0.004740488,0.009057055,0.027137913,-0.0013699423,0.0009538982,-0.010126719,-0.03985935,0.005057968,-0.036392417,0.022482833,-0.008884886,-0.028102014,0.041969445,0.017820893,0.045398764,-0.010397325,0.024949195,-0.021033272,-0.028307587,-0.028875012,0.021886574,-0.0036067038,0.042584028,-0.001390437,0.036911234,-0.013742726,0.015080503,0.0501609,-0.0046889177,-0.011566417,0.019354757,0.023777116,0.043418728,0.016564082,0.022236092,0.010040709,-0.021825328,0.007628789,-0.007884363,-0.017250849,0.0134069575,0.017547702,0.052427784,0.009064014,0.03589186,0.008598466,0.018637775,0.02212942,0.007457516,0.016164906,0.01403473,0.039443765,0.026310258,-0.007084108,-0.2893491,0.0073018246,0.02950629,-0.053940054,-0.059348505,0.010673646,0.051165003,0.040041387,0.02204886,-0.012768626,0.0014142153,0.0029467521,-0.030949611,0.034656808,0.017397739,-0.0104113,-0.011258546,-0.021339897,0.012721422,0.014002801,0.052449528,-0.022390582,0.008776353,0.022180857,-0.027738117,-0.028666247,0.014845954,0.013821072,-0.013724392,-0.03816241,0.0025851587,0.010218052,0.028931482,-0.023888623,0.0025496879,0.030294336,0.016043257,0.040253732,-0.01803895,-0.015883293,-0.0062499833,0.011466709,0.01565012,-0.0035869495,-0.026544342,-0.004676738,0.0063260226,0.0064243483,0.067802794,-0.025852345,0.044433624,-0.054682773,0.024109567,-0.05392392,0.015031589,0.039974254,0.036871962,-0.03895383,0.00016150944,-0.05021098,-0.006723994,-0.010672046,0.0005655833,-0.0068642846,-0.0007085654,0.022085108,-0.00750631,0.0010429518,0.03328782,0.032065578,0.0016880834,-0.061028868,0.04357479,0.013605194,-0.004818472,-0.0042280164,0.011484628,0.005821078,0.017496806,-0.005850322,0.0065163462,0.01154884,-0.034702998,0.021115828,0.026248155,0.02035067,-0.015147362,0.03849605,-0.0142450705,-0.016850036,0.019273765,0.05591967,-0.0019150103,-0.010451996,0.00579094,-0.010731386,0.01626054,0.059453975,-0.057952292,0.040549558,-0.0051717777,-0.0120729385,0.013726379,0.0562518,0.008295499,0.01385058,0.06303734,0.0011998566,0.0090662,0.040636525,-0.011205288,-0.013606579,-0.022996662,0.0007493239,-0.024050578,0.020979598,-0.02201181,0.0030836018,-0.024672687,0.0043032523,-0.031796694,0.029513713,0.008546997,0.0029647064,-0.029811248,0.003153341,0.024854375,0.046845987,-0.0073371157,-0.018342007,-0.00408965,-0.036753077,-0.007935049,-0.03591536,-0.05780522,0.01720404,0.016204746,0.010204862,-0.05610152,-0.03852419,0.011722365,0.033131905,-0.0153610455,-0.021613639,-0.015966343,0.013855004,-0.016614478,0.042374372,-0.04512869,0.018400148,-0.0016117584,0.016670244,0.0047964132,0.08562135,-0.004500367,-0.009304915,-0.038866047,0.066953816,-0.012059434,0.013006212,0.04619332,0.022649081,-0.02831685,-0.0022336636,0.041381903,-0.009378115,-0.005495621,-0.0014200708,-0.017564077,-0.0051953346,-0.01861103,-0.04553097,0.019853594,0.023767125,0.03323497,-0.02504837,0.00662223,0.02648335,-0.03235017,0.051289134,0.02183412,-0.0070234686,-0.036220603,-0.02660764,0.007572558,-0.015598531,-0.049181577,-0.014315583,0.036418594,-0.023783037,-0.01112193,0.031998497,-0.022481853,0.018987974,-0.0024519786,-0.01490458,0.035324723,-0.040764432,0.034242164,-0.017392011,0.006222157,-0.02025229,-0.0062477393,-0.005632121,-0.0065424424,-0.03989998,0.014506394,0.010188441,-0.20846649,0.06390242,-0.047342733,-0.023743106,-0.04605329,0.053397458,-0.010178017,-0.0017711599,-0.0068711652,-0.010699573,-0.047144454,0.019777838,0.010692899,0.006743416,0.038697474,-0.0071827364,0.017870713,-0.009025242,0.013134186,-0.010504622,0.010323521,-0.0054170084,-0.32752642,0.022236316,0.032858502,0.050786156,-0.053395685,-0.034736607,0.0029172443,0.0077978764,0.018900514,-0.031025598,0.022068046,-0.057194144,0.044833742,-0.025467178,0.029403163,-0.030497035,-0.011216748,0.0044135256,-0.028628588,0.0111569865,-0.0007926553,-0.0103564,0.008432772,-0.032766365,-0.023882389,-0.04000823,0.017782487,-0.002938777,-0.0016102457,0.0065872124,6.809939e-05,0.031580593,0.009556304,0.007082379,-0.0076903277,0.017044537,0.049120925,-0.019400511,-0.016478732,0.036692172,-0.013351569,0.0073419996,-0.035755847,0.046549816,-0.0028727313,-0.0508436,-0.036535196,0.016186673,-0.04924289,0.004513149,0.051829554,-0.03948506,-0.012688284,0.0055362387,-0.073793665,0.00039650543,-0.03763496,-0.002799725,-0.037186686,-0.015734771,0.03984857,0.041737475,0.010052761,0.014670935,0.015771313,0.02650548,0.024198983,-0.05578594,-0.038415175,-0.02153533,-0.016727138,0.017507743,0.004185645,0.047408167,0.027272854,-0.040576763,0.050727736,0.006896223,-0.025160551,-0.06452809,0.022525515,0.018347304,-0.0076861046,-0.0067950767,-0.045529347,0.024522964,-0.016128281,-0.0008161663,0.022100773,0.0011415802,-0.0062140315,-0.02386171,0.0060670506,0.011129575,-0.0082676355,-0.013955337,-0.021709127,0.010049302,-0.026232084,-0.010907724,0.023296773,0.037353665,-0.037719306,-0.009245588,0.05704574,0.009364916,0.025460836,0.011233817,0.0055310493,0.08381465,-0.02719324,0.023800982,-0.0014487751,-0.004082614,-0.01824963,-0.02981786,0.015182482,-0.035029773,-0.00040291646,-0.039187342,0.0043057604,0.0037603474,0.010140648,0.0070811165,0.013218554,-0.022020241,0.0080235675,0.04820111,-0.040315736,-0.031706937,-0.005771178,0.021414708,0.03867374,0.011689916,0.016349515,0.039597653,-0.009737345,-0.028195472,-0.028618777,0.01454123,-0.012661305,0.0219896,-0.007837431,0.026166413,-0.023647558,0.019405853,0.052489314,-0.0038223497,-0.00028115418,-0.04892275,-0.030130655,-0.05301026,0.02653602,0.028909069,0.011433964,0.0017163617,0.018296024,0.05792675,-0.030840632,0.0143716615,0.0075553367,-0.029225597,-0.007417016,0.016006202,-0.007956148,0.022058157,-0.28263634,0.029291466,0.01989175,0.0135241,0.015227577,-0.03626721,-0.0062892153,-0.0047293324,0.017832251,-0.04257197,0.020371858,-0.005691244,-0.057987988,0.0033646382,0.014091932,0.028791701,0.0011350802,0.01442837,-0.040002346,0.0019084112,0.0058124443,-0.039852917,-0.014683454,0.0011083132,0.010212243,-0.058749285,0.010511556,-0.01814385,-0.016169546,0.022705762,-0.01877355,0.025041873,-0.011588271,-0.003850249,-0.010321581,-0.071986586,0.031176137,-0.006512171,0.022802021,-0.0027862873,-0.03860994,0.017322473,-0.00629903,0.013057578,-0.014659728,-0.023761474,0.019754084,-0.10475851,0.01675925,0.029751096,-0.00808135,0.053119484,-0.039773565,0.023606678,-0.0110067995,0.025708536,0.0021630612,-0.039548364,-0.0131216105,-0.040854927,-0.0011658174,-0.019840231,-0.0021106629,0.0022876791,0.04150415,0.027564503,0.023787796,0.16321866,-0.0021893699,0.007677531,-0.027376868,0.01258508,0.026945397,-0.011679739,-0.03299644,0.019845434,0.022710633,-0.021497749,0.013682911,0.022373615,-0.014319848,-0.037401877,-0.0029904782,0.00408433,-0.0047473027,0.048128657,0.005554312,0.032820445,-0.0073265,0.0057110838,-0.009436379,0.033516806,0.043901514,0.037557065,0.013517161,0.037566315,-0.012608636,-0.0030400748,0.008595964,0.044436753,-0.03135586,0.007761981,-0.020462012,-0.03319105,0.013187438,0.018482747,-0.01605777,-0.0147493705,0.045005318,0.016245285,-0.021256547,-0.016262887,0.025537832,-0.021222651,0.015293162,-0.015302368,-0.018096332,-0.0077299355,-0.06929185,-0.036584727,0.020446844,0.009647115,-0.030528802,-0.04873795,-0.031551186,-0.009386248,0.014300077,-0.007396075,-0.03592549,0.07521147,-0.040498182,-0.0029546805,0.05199977,-0.005495702,0.029495034,-0.024454998,0.029293098,-0.0162522,0.012945242,-0.034690946,-0.0083821425,-0.027421411,-0.021794854,-0.0047124084,-0.011869862,-0.002251595,-0.0126016205,0.0095311105,-0.011528203,0.03802162,-0.028196836,0.010218811,-0.011241982,-0.03619734,0.02771778,-0.005791087,-0.0075045195,0.016225241,-0.0101373205,-0.0023737594,0.018793743,-0.010367208,0.003398011,-0.018223993,-0.009731572,-0.04503808,0.0064495886,0.021730382,0.06256208,-0.057898317,-0.0034249204,-0.0083916,-0.0044805324,0.0044409535,0.005575725,0.05499278,-0.036659054,0.060091298,-0.0037592414,-0.03573446,-0.033692665,-0.0374113,-0.020426271,-0.04737299,0.06667461,0.041657124,0.028011767,-0.004105335,-0.026127027,0.012744601,-0.013184702,-0.01661389,-0.04595022,0.03701672,0.01966279,-0.039865732,0.0045709186,0.038128786,0.009787715,-0.020709006,-0.035589773,-0.017346818,-0.002144969,0.017728005,-0.02711607,0.016430333,-0.018782731,-0.05930361,-0.043101847,0.032558512,0.041072253,0.043448836,-0.004288454,-0.007566794,0.044452675,-0.021268832,0.012898552,-0.024883911,-0.00093092356,-0.030908601,-0.0023281577,-0.013951474,0.012145341,0.014406195,0.0086051505,0.09161807,-0.008157409,0.00533424,-0.02957992,-0.030639915,-0.05086969,-0.0025071788,0.064841926,0.018257055,-0.008671355,0.030331159,-0.0051895827,0.0048049255,-0.019444475,0.033151243,0.010685782,0.06272723,0.049686722,0.026120108,0.0020824615,0.008311309,-0.018537482,0.034728616,0.0016134124,-0.013191935,-0.028719397,0.033392083,-0.061879046,-0.006242086,-0.02830046,-0.0072184275,-0.010272158,-0.028373716,0.01606003,0.01612009,0.009481051]	2026-09-08 09:32:54.310023+00
12	school_info	12	0	Kutubxona	Maktab haqida — Kutubxona\n\nMaktab kutubxonasida 12 mingdan ortiq kitob mavjud. Kutubxona dushanbadan shanbagacha soat 08:00 dan 17:00 gacha ochiq. O'quvchilar darslikni bir o'quv yiliga oladi.	/about	b4ec4d256059114a47611f662f9fe6bd17140d798bb3b153945d03a7a22f8376	[-0.014508167,-0.006935616,0.056281585,0.02901068,0.011467317,-0.016177118,0.029430514,-0.003977047,0.023065232,-0.08682797,-0.039782144,-0.004826045,-0.014040773,-0.05873665,-0.028181747,0.035371307,-0.01910753,-0.038987134,0.035684932,-0.032432985,-0.007034407,0.0076921913,0.030964179,0.014141778,-0.012565454,-0.0060294135,0.004399314,-0.04255368,-0.008772981,0.21175607,0.0329399,-0.013754596,-0.026396757,-0.07397003,0.027358105,-0.0016993993,-0.0030956368,-0.021151742,-0.035318177,0.013892833,-0.0013879996,-0.019302411,-0.06386744,0.0052920394,-0.024495589,0.03103995,0.026816834,0.01103419,-0.023792373,0.015274968,0.013975082,-0.005630491,0.016064722,0.025584908,-0.026597427,0.046900947,-0.0321649,0.010989125,0.02615364,-0.005466067,-0.050687227,0.0013428129,0.029766396,0.007830106,0.043056484,0.004085875,0.034475148,0.010986131,-0.0012380071,0.06751621,-0.00034961835,0.04245231,-0.024512984,-0.011918941,-0.01594305,-0.022194253,-0.0168693,0.021826642,-0.012435433,0.015301876,0.009872057,0.011171795,-0.04747313,-0.03222675,0.05623782,-0.013600506,-0.0005713789,0.030963074,0.026349576,0.026775392,-0.0027999615,0.026712012,0.00053321297,-0.0317757,-0.02223025,0.027108992,0.028587963,0.015418383,0.0018101232,0.060983695,-0.01891334,-0.00487861,0.037075743,0.0038896173,0.035727564,0.008370474,-0.018623767,0.036871053,0.04851256,-0.014912742,0.0044136643,-0.28370303,0.022803709,0.025946528,0.00019419557,-0.05469939,0.0038795702,0.03230574,0.044751093,0.03773295,-0.001050387,0.0051014046,0.021471556,0.039843064,0.023238542,0.011927858,0.0016444348,0.009349641,-0.009725745,0.012967756,-0.03723367,0.024812935,-0.029616773,-0.012600309,-0.011510276,-0.011610301,-0.032828953,0.016822109,0.017228873,-0.018790403,-0.044500224,0.012527439,-0.021526659,0.05733304,-0.035466228,-0.0038648313,0.04418448,-0.00449242,0.05995844,0.013241769,-0.04347427,0.017264362,-0.013050953,0.036766693,-0.006859857,-0.019455027,-0.020687921,0.029612508,0.024813063,0.027431065,-0.0035640677,3.210689e-05,-0.014927968,0.016008057,-0.04464725,-0.027064655,0.003788965,0.07795755,-0.048633117,0.013154828,-0.018926172,-0.0057615195,-0.009414611,-0.029327404,0.042924903,0.0026452118,0.010197222,0.019134365,0.015062822,0.032745175,0.03972345,0.0067892647,-0.056451444,0.007555301,-0.017088119,0.0067266733,0.0051994957,0.0024244387,0.021448653,0.050973877,-0.0141520025,0.014783451,0.033983976,0.002132645,0.0076966505,0.045972757,0.0008344736,-0.04550094,0.037062414,-0.015043797,0.018991515,0.0030287185,0.023592042,-0.012713689,0.011229907,0.0009784107,0.032502502,0.045176677,0.0097830985,-0.03661641,0.022395391,-0.041767057,-0.026596615,-0.00910873,0.0018481887,-0.03883666,0.0127369175,0.03515604,-0.04442739,0.013413397,0.04058897,-0.0057100668,0.028412858,-0.0136087835,-0.008945364,-0.027491903,0.037595257,0.013496687,0.029767726,0.008445437,-0.02463636,0.03052275,0.059133943,0.0117799295,-0.014140874,-0.035737492,0.0006996478,0.016489072,0.031749018,-0.061832346,-0.0186347,0.0010462957,0.009701363,0.0026037365,-0.004931745,-0.024611654,0.030491,0.029899035,-0.0112462845,-0.061693035,-0.05028143,0.0026145247,0.0063773794,-0.023348749,0.009389911,-0.029976077,-0.005971471,0.002280701,0.017821096,-0.00087763736,0.041453652,0.0011500256,-0.0057149855,0.005806121,0.036878075,0.027715268,0.009247669,-0.061600443,-0.019221792,-0.01978608,-0.0018737805,0.018980417,0.01868629,-0.03314,0.029221002,0.011970836,0.00095394964,-0.0029662785,-0.0259532,-0.018798368,-0.033913404,0.008862155,-0.011913849,0.015114347,0.012083738,0.0057845437,-0.034122694,0.022486508,0.011068596,0.0057736486,0.020423228,0.024144148,0.03421879,-0.016668769,-0.0028636528,0.0075059338,0.011348409,-0.044428267,-0.040306695,0.034397237,-0.009149749,-0.001221704,-0.0014594983,0.004124051,0.009840258,0.022256093,-0.015198696,0.015301934,-0.06243963,-0.025392063,-0.0627832,-0.0053765457,-0.038774814,0.013493812,0.014816748,-0.0011887657,-0.017137485,0.002247687,-0.005073195,-0.19530116,0.03743433,-0.055261146,-0.0051806415,-0.06702477,0.011872192,0.006619634,0.0032490958,-0.006024656,-0.0063534393,-0.047892656,0.01643927,0.035204183,0.021048952,0.036064334,-0.017513657,-0.018279854,-0.008856439,-0.003082804,-0.006622192,-0.0069248634,-0.010828081,-0.31115523,-0.013751012,0.037278004,0.04310248,-0.047029644,-0.04174902,-0.010064765,0.0018362373,0.03540124,-0.03526745,0.05613424,-0.043471977,0.03246283,-0.02140376,0.045854617,-0.015958667,0.017579943,0.031192234,-0.046575304,-0.012129036,0.020657975,0.035875384,0.014906904,0.0077226115,0.0037952983,-0.0055153877,0.010365573,0.023237398,-0.0032104896,0.005614842,0.0054103173,0.00887112,0.042366832,0.017272681,0.014779331,-0.0129025085,0.03204621,-0.024760894,-0.037546795,0.041837994,-0.003125072,0.017536767,-0.012219312,0.044902086,0.0035486426,-0.034700226,-0.003052878,-0.0071706166,-0.00280879,-0.016664386,0.05916506,-0.028901896,-0.019979456,0.054925155,-0.038448043,-0.011179488,-0.05421325,-0.03878468,-0.0132483505,0.026060937,-0.011408633,0.038235623,-0.015752025,0.0034014033,0.040180154,0.059108846,-0.03117649,-0.03918937,-0.03361105,-0.060646284,-0.035259802,0.02288207,0.012346655,0.013555201,0.021022966,-0.06441131,0.055294003,0.03256165,0.00028631746,-0.027088942,0.013148766,-0.0042973994,-0.010217116,0.010405706,-0.008587589,0.031358156,-0.018744819,0.011824955,0.06063751,-0.02959762,-0.028413463,0.021035006,0.0032416275,0.036594804,-0.02810921,-0.0061554373,-0.01351928,0.019882414,0.022280447,-0.0118864095,0.0198328,0.034891054,-0.061650116,0.046562918,0.03185868,0.0044964277,0.034601465,0.011512106,0.061377924,0.07523514,-0.04764876,-0.010109528,0.01957022,0.010221017,-0.017162446,-0.04037504,-0.04165851,-0.014094144,-0.016191272,-0.037554763,-0.005029313,0.022905603,-0.0127441855,0.018232761,0.0035402651,-0.04629795,0.0031817288,0.06316193,-0.022128448,-0.0056361137,-0.006263064,0.030077007,0.0652584,0.01412162,0.030731393,0.022861218,0.004328947,-0.036690515,-0.006504332,0.03476659,-0.008337385,0.029139575,-0.022343526,0.033257738,-0.034682628,0.015077645,0.030811908,0.0032356274,0.007492349,0.02516814,-0.010740415,-0.059090514,0.007888196,-0.0048617464,-0.01556702,0.0044699167,0.008295806,0.039781053,-0.040430997,0.023968527,0.012192951,-0.025432589,0.019096326,0.00081271573,0.012794128,0.0014870492,-0.27422187,-0.012539184,0.009898043,0.023853555,0.0032328197,-0.030263046,-0.0037092285,-0.027144616,-0.035592303,-0.020949721,0.03003022,0.0017473517,-0.055817537,0.012642332,0.0024614548,-0.011741545,-0.010236758,0.027944246,-0.03953377,-0.0028461027,0.019783491,-0.05722448,-0.0068597533,-0.0056821075,0.03105223,-0.081274234,0.018318398,-0.0342843,-0.018062698,0.01736749,-0.036376163,-0.014049415,0.026727092,0.017798182,-0.008812124,-0.033151843,0.06561044,-0.032321017,0.013859174,-0.033409722,-0.007931818,0.038875617,0.01383403,-0.0026796844,0.014710961,-0.017595433,0.0023516018,-0.09716458,0.015018084,-0.02207874,-0.028360762,0.065798625,-0.05803565,0.042601988,-0.026017996,0.05739623,-0.042908914,-0.05485238,-0.033566635,-0.052092873,0.018469606,-0.0043309047,0.001141882,-0.021207964,0.021196853,0.027088966,0.0048091337,0.14238296,-0.038135275,0.035029285,0.045152415,0.044657454,0.009462102,-0.012427945,-0.022019926,0.045236953,0.011324829,0.012983651,-0.012121742,-0.0025584148,-0.056700777,-0.02432133,0.009244745,-0.007040129,0.0046291584,0.051921178,0.008979635,0.050732426,0.001189899,0.014976975,0.03030886,0.03993947,0.010091506,-0.0048256386,0.055894766,0.030050132,-0.006016998,-0.03721927,-0.017376574,0.0132695595,-0.056623768,0.020496095,0.020841984,-0.004998313,0.0268784,-0.036737744,-0.010516528,-0.035235655,0.039115895,0.049166348,-0.03478587,-0.03441926,0.00082079286,-0.033214077,-0.008175487,0.018113982,-0.032905236,0.013657045,-0.014881173,-0.030015104,-0.010949689,-0.027486078,-0.029348854,-0.034943476,-0.034514315,-0.025700254,0.014823158,-0.05479584,0.01518632,0.07701778,-0.0319925,-0.01163179,0.03409925,-0.007448611,0.027343472,0.0035157213,0.040687233,-0.0011557854,0.022916434,-0.045453604,0.021079427,-0.04033006,-0.013016671,-0.012382602,-0.0033803869,-0.017266197,-0.04589904,0.016866645,0.04993173,0.0246932,-0.026253927,0.024852531,-0.024799382,-0.020095447,0.043639474,0.010278289,-0.009046153,0.022440178,0.0006118395,-0.039132614,0.00028779721,-0.020530058,-0.0021925028,-0.040781353,0.0020034425,-0.039769962,-0.01147194,0.011658356,0.02116094,-0.02308614,-0.012598046,-0.01865234,-0.019226369,0.018247563,0.0012145618,0.04836822,-0.014743083,0.03598267,-0.022971788,0.00039850798,-0.037424255,-0.021529911,0.006001615,-0.011678099,0.034004737,0.05581145,0.00575256,-0.0008324043,-0.046765685,0.027125478,-0.02535834,-0.0012819851,-0.015459474,0.08824004,-0.0025559578,-0.023181625,0.0098488135,0.036673617,-0.03535692,0.0049868645,0.0023744297,-0.050444067,-0.008826802,0.043775283,-0.019017361,0.02012961,-0.007262161,-0.029932596,-0.029611297,0.02404639,0.027177913,0.017534578,0.018716251,0.011929051,0.061334923,0.027986685,-0.011286069,-0.031255644,-0.053884476,0.0057827537,-0.028094366,-0.041579537,0.0022933418,-0.009824292,0.027007833,0.07494012,-0.004111839,-0.0070547764,-0.07035968,-0.0090117,-0.07042579,0.02081238,0.01784536,0.04562185,-0.003452162,-0.005937998,-0.008359581,-0.008494537,-0.0049821236,0.017324055,0.008740271,0.0018786913,0.019951178,-0.0011474633,-0.010772709,0.01625148,-0.0026784881,0.009333794,0.044285603,0.012060899,-0.06267904,-0.04257674,-0.015896797,0.03217036,-0.025974799,-0.015481144,-0.050471056,-0.0049354406,0.019830946,0.0023533779,-0.02011373]	2026-09-08 09:32:54.310023+00
13	management	4	0	Maktab direktori	Maktab rahbariyati\n\nQalandarov Bahodir Sotivoldiyevich — Maktab direktori. Bog'lanish uchun maktabning murojaat sahifasidan foydalaning.	/about	3c250a6aeb89db9732979e12c71edffce192cbb9d8f6fb4c92a97f3f2d76222c	[0.0011587827,0.034352276,0.018567283,0.009019173,-0.021041729,0.04808481,0.0211905,0.012294474,0.017188506,-0.07861086,-0.012393317,0.017504469,-0.036470197,-0.028345002,-0.026646532,0.021617405,-0.023138065,-0.0052817697,-0.00033673388,-0.061460122,-0.008038781,0.015361435,0.02787961,-0.016106054,-0.012771366,-0.023278253,-0.006941117,-0.048037335,-0.036826838,0.21783982,0.022875663,-0.05184376,-0.009453,-0.04150521,0.040364314,-0.019924458,-0.0428466,-0.01605564,-0.033944324,-0.0007117387,-0.031518072,-0.013742595,-0.044671882,-0.020804547,0.009494395,-0.042933628,-0.004737132,-0.013098614,0.026889207,-0.031882152,0.0037514837,-0.04454068,0.038154017,0.0032983148,-0.05278878,0.03211884,-0.026029358,0.03524857,0.00945543,0.012691538,0.02067112,0.01525841,0.058155905,0.011975336,0.026168937,-0.025897173,0.019206556,0.025225013,-0.007511331,0.02412104,0.008540574,0.015759263,-0.0080950735,0.020445343,-0.021716392,0.016676046,-0.0032665671,-0.011564136,0.0077605937,0.032804623,0.030854344,0.024448896,-0.029335681,-0.028163187,-0.017151177,-0.025752787,-0.023789898,0.033339716,-0.011906736,0.07411637,0.0063037155,0.02467722,-0.02912503,-0.015363152,0.0050329277,0.051327273,-0.014060296,-0.023411153,0.010498002,0.025013084,-0.025846286,0.03459458,0.04986876,0.018203715,-0.0031910639,-0.012413796,0.002878428,-0.025708342,0.02035289,-0.027062522,0.024652384,-0.28088465,0.024853257,0.020314312,-0.027782954,-0.04268279,0.015949924,0.0116601335,0.029826492,0.030780224,-0.01516619,0.02334859,-0.0108329365,0.0135149965,-0.012940717,0.012561598,0.005309219,0.031672128,-0.0016998788,0.026796946,-0.013692714,0.0121194795,0.0044412576,-0.049599733,0.015269815,-0.019237503,-0.040901493,-0.0289691,0.0087632425,-0.022451784,-0.053013235,-0.028544666,0.02708738,0.0032146086,0.022001842,-0.018411784,0.037333183,0.024251148,0.053113658,-0.005593725,-0.015565616,-0.011801528,-0.044541594,-0.029028954,0.025376298,-0.015935352,0.01584243,0.01693165,0.002786967,0.06872217,0.002688313,0.018013475,-0.013057871,0.025548333,-0.021564262,-0.0036613247,-0.0055640684,0.026470369,-0.039308008,-0.014338885,-0.019356783,0.004563066,0.0038121883,0.0018166159,0.009460381,-0.013619749,-0.00974162,0.008313539,0.020174691,0.05306345,0.043522354,-0.020162562,-0.036698207,-0.025664398,0.022080645,-0.017690348,0.040436614,-0.033924438,0.028539553,0.07956183,-0.0019542277,0.023509841,0.0143947825,0.022413488,0.059846073,0.040228643,-0.006349278,-0.036656957,-0.0051355506,-0.008790201,0.002960478,0.014122251,0.0402204,-0.05350516,-0.010369314,0.031089792,0.01809838,0.022967482,-0.0012487208,-0.047629338,0.006859997,-0.013418895,-0.027179325,0.01031309,0.03634537,-0.036470897,0.010342085,0.039418872,0.0013805516,0.03834977,0.049040057,-0.026447063,0.021448048,-0.021224072,0.010996694,-0.03063791,0.046184923,0.01144888,0.040217943,-0.012568766,0.0066473465,-0.026341993,-0.0064957454,-0.038342524,0.002158445,0.0050325408,0.010280794,0.038949896,0.055944312,-0.029359942,0.02708022,-0.019415848,0.0017969003,0.008087209,0.0034034352,-0.03814611,0.015404726,0.042273093,0.0009563178,-0.007890714,-0.040223643,-0.00036385123,-0.013868693,-0.013189037,-0.011142707,-0.0033722871,-0.010260955,-0.006237656,0.021492649,0.0016051907,0.025578236,-0.013376765,-0.013545461,0.03516819,0.01692484,0.008047006,-0.012842163,-0.037098017,0.02436275,-0.010677837,0.03229242,-0.012686692,0.0105154235,-0.02130175,0.04302632,0.03985319,0.019346103,0.011347335,-0.014448724,0.025159966,0.00014134467,-0.016856717,-0.030634155,0.015878394,0.02888699,0.031730477,-0.07046023,0.054222215,0.005590792,0.024542602,0.061716698,0.017680427,0.002985676,0.014449727,-0.031830747,0.04264766,0.015308374,0.02242386,-0.01579552,-0.0039820815,-0.039799295,-0.00013002747,0.013378812,-0.017572498,-0.014881717,0.023919217,0.02617639,0.0047054617,-0.021164505,-0.02683034,-0.047894422,-0.010358952,-0.02504866,-0.020975258,0.024151614,-0.04015259,-0.036710247,0.021584202,-0.06084599,-0.1870779,0.014992616,-0.0011537991,-0.0052147824,-0.05398822,0.02991459,-0.013943832,-0.000243179,-0.04447857,-0.0020140903,-0.041280124,0.0104612075,-0.0024903405,0.031291876,0.0053081536,-0.023217253,0.029603658,-0.026202789,-0.021593064,-0.011442406,-0.030683286,-0.0013897057,-0.31699905,-0.013511497,0.04381462,0.05625404,-0.019761927,0.005935133,0.0015028197,0.01251676,0.013587163,-0.03293538,-0.013116748,-0.0002745297,0.028668897,-0.0101130055,0.04319379,0.018068124,-0.023130322,-0.028301032,-0.0005970076,-0.0030344252,-0.014185348,0.034701332,-0.016448157,-0.03771028,-0.029430293,0.00970873,-0.010687796,0.018859139,0.006141243,0.048514273,0.019471195,0.030076535,0.027115613,-0.0291689,0.015587817,-0.03778996,0.062453616,0.007608233,-0.0063743177,0.042364128,0.0034517348,0.00021262457,0.04962667,0.08049438,0.020745292,-0.0021176508,-0.031698477,0.021104064,-0.03572762,0.034112412,0.06822711,-0.048001546,-0.0005394175,0.04143888,-0.013407703,0.0062472993,-0.043077044,0.009195079,-0.03623428,0.0066342596,0.03484356,0.03397379,-0.05622529,0.026588462,0.029893365,0.0689167,-0.0036191756,-0.008809433,-0.058200922,-0.048165686,-0.013945194,0.010012034,0.030898932,0.001963521,0.044821523,-0.013699155,0.03162215,0.03775616,-0.010105778,0.01539484,0.001933318,-0.035304952,0.0043357355,-0.0014575352,-0.06294574,0.04080391,0.0268628,0.012443636,0.015849348,-0.060097814,-0.041430563,-0.030706907,-0.0092660645,0.025853623,-0.05973276,-0.014721031,-0.023814851,0.053788118,-0.015049144,-0.03651556,-0.0041366485,0.018906154,-0.029555531,0.03645531,-0.028906075,-0.008056009,-0.029237071,-0.04095176,0.040887196,0.04842538,-0.02538846,-0.027013285,0.017044453,-0.0046690786,0.0030543553,0.031743616,0.014241541,-0.017168628,-0.05859423,-0.02846931,-0.021420198,-0.0070408075,0.00018392559,-0.038390327,-0.00484176,0.010323281,0.0065646954,0.049111005,-0.043756697,-0.008376045,-0.02971234,0.0037241608,0.009578548,0.0058574383,0.008038496,0.03524326,-0.008979168,0.030566758,0.029572617,0.05717089,-0.0066462383,-0.013979308,0.026402444,0.0012435173,-0.042668145,-0.0024769048,0.008347143,0.043956913,0.015456354,-0.015396711,0.036429297,-0.029919006,-0.017772371,-0.0024002811,-0.016806463,-0.017426513,-0.007856098,-0.0067923563,-0.05108107,0.04327946,0.0036663683,-0.07065865,0.05002429,0.02662989,0.027324965,0.0012931059,-0.2626972,-0.002667893,0.030449271,-0.0031614501,0.017828884,-0.056556694,-0.016338317,-0.0030396404,0.018273415,-0.043526538,0.04327969,0.031886674,-0.068644054,0.040725816,0.030831536,-0.011223672,-0.015177711,0.021437086,-0.026152441,-0.021731507,0.024853671,-0.060870044,-0.03616437,-0.023572285,0.057945997,-0.05165124,-0.00832948,-0.03416779,0.0005677547,0.03833821,0.020683536,0.0010298277,-0.036825653,-0.022684466,0.0068413382,-0.05453153,0.027584955,-0.02861741,0.017647963,-0.007272039,0.048386823,0.018337794,0.001719983,-0.031441122,-0.0168991,0.036502175,0.018186849,-0.12192205,-0.006822985,-0.011814723,0.0028679408,0.0025019997,-0.03210544,0.037557922,-0.015863756,0.010143626,0.017645221,-0.005987566,-0.028741892,-0.018135995,0.010009303,-0.020802071,-0.021185214,0.0021206052,0.009372695,-0.011432117,0.036519755,0.14703734,-0.012819363,-0.010041978,0.027421832,0.039884493,-0.004294505,0.018750986,0.0044557047,0.028291767,-0.030536106,-0.003394515,0.0017385583,0.040256064,-0.034383975,0.029105924,0.03152831,0.00060359266,0.0383453,0.032445163,0.014222621,0.00052071083,-0.042280566,-0.012526573,0.0058861957,0.03277986,0.03953943,-0.008302138,0.017324053,0.051573094,0.0069824713,-0.031149708,-0.022519693,0.029598568,-0.08941412,0.024515664,0.009621054,0.014555212,0.010065533,-0.026654296,0.019583894,0.030929606,0.028052643,0.009411714,-0.019852823,0.025892323,0.0009260286,-0.049184743,0.047497563,0.016684618,0.014329066,-0.00044779317,-0.023259323,-0.018310199,-0.044432994,-0.004057525,-0.006169949,-0.017048191,-0.034117833,-0.021460406,0.020034403,-0.024053287,-0.02567325,0.08020502,-0.015519649,-0.013963217,-0.019616736,-0.0041575795,0.03662213,-0.029515393,-0.0024450887,0.0146338595,-0.0027542436,-0.062352415,-0.012328055,-0.03325908,-0.005738276,-0.02899432,0.015601623,-0.038990445,-0.049811475,0.0022788874,0.012959031,0.016653476,-0.039781228,0.011130828,-0.033393744,-0.025212146,-0.0042884005,-0.038176328,0.032027002,0.03303383,-0.048309464,-0.0120963985,0.0066924593,0.015461643,-0.009620721,0.003776923,-0.024343606,-0.053982064,0.017005064,0.033998508,0.0499191,-0.009552225,-0.017864013,0.029969221,0.016601156,-0.006283187,0.03189308,-0.0063826866,-0.011854903,0.040652543,0.0053597065,-0.0033975546,-0.029004171,-0.017312273,0.0011991536,-0.033206552,0.056729086,0.028895147,0.010709448,0.017026078,-0.007948484,0.030288445,-0.07276771,0.011933756,-0.018418292,0.067131236,-0.017938586,-0.010925114,0.047605928,0.01943519,-0.0073799836,-0.06482887,-0.027477842,-0.01936547,-0.048450124,-0.00034125964,-0.047581363,0.0334907,-0.042531062,-0.04535134,-0.029308956,0.023019375,0.034566194,-0.0013911106,0.038142927,0.012862268,0.011612654,-0.02312991,-0.0046233474,0.026351605,0.012330086,-0.03265928,-0.02546662,-0.045041062,-0.021609392,-0.011951381,0.036812402,0.08647561,0.019855874,-0.0062783873,-0.013789893,0.012610688,-0.05653971,-0.0026732439,0.0077989395,0.0047688796,-0.07806182,0.015471994,-0.011560093,-0.003265732,0.027566794,0.013113388,-0.000814783,0.011837814,0.014726251,0.022679152,-0.02230814,-0.01632205,-0.022755593,0.009721284,0.040712494,-0.020877102,-0.022875382,0.014319578,-0.036980547,-0.06623255,-0.01999033,-0.008829873,-0.016862568,-0.039965738,-0.0050784512,-0.008406797,-0.025673237]	2026-09-08 09:32:54.310023+00
14	management	5	0	O'quv ishlari bo'yicha direktor o'rinbosari	Maktab rahbariyati\n\nYusupova Gulnora Rashidovna — O'quv ishlari bo'yicha direktor o'rinbosari. Bog'lanish uchun maktabning murojaat sahifasidan foydalaning.	/about	9bb97e86c5e78451f966aa998063827d8d6ee17b9638b277a4f44db51a7b56c7	[0.023721622,0.03194433,0.026808754,0.014594373,-0.024750585,0.023153666,0.032325026,-0.018865772,0.015366227,-0.061989993,0.008483363,-0.015222723,-0.027022408,-0.0071163215,-0.02107379,0.018010246,0.02234429,0.011355569,-0.008094943,-0.07282641,-0.0052458136,0.0050699925,0.03820304,0.0242396,-0.0030139734,-0.036340047,-0.005084872,-0.01806848,-0.02533846,0.1887696,-0.015105436,-0.013472089,-0.016438328,-0.042780362,0.012232049,0.024596201,-0.004833164,-0.0038976183,-0.042433366,0.0031682947,-0.0387675,-0.01840726,-0.04387493,-0.025394417,-0.035922334,-0.019531813,-0.030960757,0.008166666,-0.0049218754,-0.043831814,-0.0061561326,-0.050898075,0.007998803,-0.005122018,-0.026233787,0.061679117,-0.04115119,-0.023526177,-0.0005254081,-0.0021481984,-0.01176729,0.050905302,0.01795225,0.038969766,0.04667642,-0.022585204,-0.00054861413,-0.013647137,-0.012406311,0.02590053,0.0007567668,0.029609565,-0.006626446,0.037570804,0.0043980745,0.0032212234,0.013727023,0.0061132032,-0.0018807948,0.03764436,0.010688662,0.045330863,-0.026027206,0.015770296,0.03470188,0.013947217,0.0033776457,0.044694405,-0.027503267,0.038375948,-0.03144862,0.015940858,-0.010359392,0.015105183,-0.0031057976,0.037801854,-0.001974721,0.013282649,0.025596717,0.041598573,-0.007813877,0.0013690172,0.036407623,-0.007934234,0.02148997,-0.04821938,-0.0121639725,7.7281744e-05,0.036859017,-0.0051971255,-0.011615519,-0.28262502,0.0062899212,0.026934797,-0.05345538,-0.061032847,-0.012832161,-0.010382006,0.055056747,0.02877135,-0.005314681,0.017215654,-0.00640565,-0.011513296,-0.0067569055,0.021202954,-0.017516682,0.013228917,-0.037808396,0.016027944,-0.007911185,0.004074335,-0.020942677,-0.025010621,0.0236689,-0.00735984,-0.035142254,-0.019539474,0.021458019,-0.027770111,-0.07518236,-0.012844485,0.045025,0.00918949,0.0368878,0.028335236,0.03516956,0.039297327,0.07335435,0.011799751,0.014275282,-0.0010647324,-0.012672444,0.041126233,0.0019681372,-0.0026967772,-0.030179176,0.05498817,-0.0030217362,0.06222821,0.02935685,0.0064820987,-0.014908281,0.01940967,-0.0066867913,-0.027449291,0.04119223,0.024597315,-0.042802814,0.009801027,-0.007190115,-0.013857384,-0.038972322,0.0007386767,0.0070932386,-0.0036724934,-0.020094737,0.010497818,0.023153666,0.0435239,0.021909986,-0.0030175382,-0.010543071,-0.008936865,0.03259893,-0.011479629,0.049512103,-0.03212794,-0.0077949767,0.072802775,0.0067774486,0.068849824,-0.0037188982,0.0125215575,0.04218831,0.08159165,0.006230357,-0.006378358,-0.011852166,-0.0007495446,-0.000810023,0.03844426,0.064715974,-0.045238134,0.011060868,0.0214472,-0.0049395487,0.040297143,-0.013061549,-0.034408644,0.025190214,-0.039129637,-0.038997307,0.004483991,0.027482307,0.006245897,0.048067953,0.07139949,0.0065678004,-0.0025937445,0.043694243,-0.027283637,0.004437437,-0.031308994,0.028061798,-0.004147049,0.012723859,-0.003673132,-0.0019059144,-0.014615882,-0.02027378,-0.017441867,0.01508876,0.007445897,0.0014079527,-0.037900984,0.017091079,0.0450494,0.03299272,-0.026078647,0.019021247,0.00883319,-0.028213533,0.0072345785,0.0012942215,-0.041973807,0.010562289,0.07309891,-0.00032752025,-0.0029201156,-0.017535977,-0.003170071,0.015148111,0.00093939493,0.017197778,0.011104802,0.012820872,0.0219037,0.028680857,-0.008772274,-0.007065895,-0.019027928,-0.0104737,0.02460236,0.05249278,0.0031397599,0.03211689,-0.06109235,0.07067908,-0.012515052,-0.007942257,0.027970426,0.006122165,0.0075995177,0.026251832,0.0455511,-0.009135086,0.007372257,-0.008157167,-0.016947538,-0.018687626,-0.018985465,-0.0064824773,0.02297868,-0.009102058,0.044935573,-0.07128098,0.06611514,0.015450125,0.007486853,0.034305297,0.014085498,0.014138033,-0.01695871,-0.0023900121,0.06556033,-0.010181804,0.014623025,-0.023868142,-0.0334091,-0.036762167,0.02364038,0.00700232,-0.020666087,0.016623897,-0.015864734,0.038534634,0.017401671,-0.020409739,-0.021639273,-0.059557628,0.006566928,-0.0045075445,0.005928518,0.0073005995,-0.034731995,-0.009440559,0.0026077235,-0.022204604,-0.19369073,-0.01423802,-0.01641473,-0.04662987,-0.02864948,0.0051810252,0.00414467,0.016912322,-0.0435713,-0.016108602,-0.050029784,0.010259431,0.014251968,0.024013013,0.0071374704,-0.02533899,0.013526568,-0.03184521,-0.026159227,-0.007846025,-0.030449301,-0.018721217,-0.32715377,0.025738984,0.013173225,0.009287005,0.0155147035,0.03388389,0.014378073,-0.004639699,0.012553261,-7.374229e-05,-0.013638498,-0.0073300884,0.03742766,0.0008924218,0.022654772,0.009356555,-0.01388697,-0.024733027,-0.02475197,0.017407607,-0.003495248,0.053831134,-0.011988223,-0.0035743415,-0.025653617,-0.011530749,0.0031111317,0.016247738,0.0073540444,0.047840815,0.03933713,0.035755273,0.048679397,0.0017869918,0.02855923,0.026065564,0.06804686,0.0019381421,-0.011444945,0.001893819,-0.009221338,0.01808326,0.0035539453,0.041246444,0.031081002,0.018023929,-0.033342067,-0.015805574,0.00037622094,0.017602684,0.07187487,-0.0066449414,0.016578324,0.015489093,-0.042778324,0.0028524192,-0.029065453,-0.033266447,-0.009543574,0.024230273,0.03308853,0.008708276,-0.038233303,0.0034252394,0.032127958,0.03105318,-0.025068583,-0.036136728,-0.028032035,-0.029741704,-0.02077403,0.02193656,0.02825209,0.01900446,0.009989941,-0.02034367,0.045087904,0.0074998834,-0.025856461,0.0034310375,-0.020478807,0.008117042,-0.024190336,0.020285375,-0.04211467,0.013430633,0.0112861395,0.027300317,0.024700576,-0.03843815,-0.063543096,-0.0064362027,-0.027253916,0.026418658,-0.06148908,0.04693164,-0.007484623,0.02738042,0.0018038116,-0.011471839,0.0015742652,0.0336447,-0.058162488,0.055231955,-0.018173406,-0.009254347,-0.011792476,-0.057815876,0.010256162,0.041476805,-0.027869226,-0.021167047,0.008704197,0.0017883178,-0.049418416,0.031750843,0.0039827614,-0.025619062,0.0019533534,-0.01538653,-0.013978638,-0.0017540858,-0.007839763,0.017262148,0.006823281,-0.0011047203,-0.02366919,0.0839275,-0.028418956,0.0065198103,-0.014591113,0.012536356,0.023113977,0.00027584977,0.047983684,0.011370739,0.014399293,0.021648098,0.029413493,0.010787182,-0.0070140734,0.032511305,-0.026577597,0.004795953,-0.051532444,0.020480327,0.024192536,0.08638096,0.0049013975,0.009872674,0.0318721,-0.014910972,-0.026697164,-0.0018815997,-0.015194443,-0.024561929,-0.0007199039,-0.0057567,-0.0544108,0.03392716,0.016260006,-0.05562571,0.03447523,0.045630075,0.041963235,0.015916547,-0.27613932,-0.0043749665,-0.017644336,-0.023459055,-0.014771667,-0.0190599,0.007713584,0.016422888,0.011355584,-0.061760187,0.065555245,0.007125776,-0.050078515,0.028999409,0.004695951,0.0039872024,0.019124946,0.025102174,-0.020222532,-0.0074422555,0.011866052,-0.04665995,-0.044137545,-0.0254371,0.049160164,-0.062338997,0.0024182817,-0.02280386,-0.0045801853,0.042041194,0.04014567,0.009633788,-0.018213248,-0.0023299574,0.0040211417,-0.024997842,0.026009599,-0.024948778,0.01287432,0.01254298,0.037414446,0.033197958,-0.053583167,-0.032752864,-0.0031244897,0.008760837,0.031600334,-0.118465535,0.0030414106,-0.013364347,0.005876282,0.04015716,-0.004471366,0.031489436,-0.024732394,0.00245088,0.0050132466,-0.026032401,-0.016402133,0.0033492583,0.0020479145,-0.016770745,-0.027533704,-0.0069476264,-0.011347729,0.0007028923,0.03719946,0.18748292,-0.01610212,-0.0021555321,0.0117957685,0.02149435,0.0018832831,0.0067883786,-0.009139177,-0.009878419,-0.009807335,-0.004944942,0.03321089,0.04441108,-0.041242123,0.012961388,0.042925686,-0.021561353,-0.01691804,0.059348647,0.03723061,0.006598375,-0.0139135,-0.018277913,0.0021291357,-0.000531855,0.051405486,-0.008390984,-0.01724859,0.040272202,-0.0023097948,-0.0015350662,0.028165901,-0.013718418,-0.09662564,0.04035906,0.011564733,-0.0038950378,0.030946666,-0.0070270565,0.0061913594,0.009990262,0.023891522,0.042184252,-0.01826055,0.039281383,0.010601288,-0.052502308,0.00053340214,0.04177973,0.03382738,0.033645507,0.015937062,-0.042644624,-0.016306005,-0.008902738,-0.018899526,0.027612954,-0.051223658,-0.025882237,-0.01896017,0.0026583518,-0.013135171,0.07058659,0.026382618,-0.021938441,0.036202934,-0.011228939,0.005899221,-0.064228006,-0.0009106999,-0.0033909446,0.020988505,-0.017882954,-0.0030859602,-0.055772875,0.009346993,-0.010784099,0.030046526,-0.007701732,-0.025864227,0.012803251,-0.0014378255,-0.0046414384,-0.04431923,-0.0013723328,-0.023181835,-0.004133216,0.033751313,-0.02753996,0.0010434943,0.03044077,-0.012420686,-0.029087072,0.034933496,0.021722777,-0.008322956,-0.020205416,0.010715756,-0.027645413,0.023461187,-0.0111916615,0.01813421,-0.032539688,-0.03160567,0.009099652,0.050942674,0.015124996,0.028105447,0.014593897,-0.031183744,0.040693156,0.009599394,0.011312232,-0.027158126,-0.0056777443,0.0047634393,-0.021384377,0.06864629,0.019768342,0.020158827,0.02541352,-0.010361508,0.048912596,-0.05310736,-0.0013849835,-0.032486122,0.04415454,-0.022082096,-0.030058378,0.03112159,0.045840234,-0.009793181,-0.037661575,-0.04028447,-0.049391575,-0.010907274,-0.037979666,-0.012179755,0.02080449,-0.042538986,0.0034310382,-0.018177064,-0.0016273982,0.03423752,0.00755025,0.009408365,0.034989163,0.0025075707,-0.03210514,-0.010283497,-0.03259005,-0.002218113,-0.015084531,-0.030704321,-0.02707832,0.0021010356,-0.050077565,0.013323887,0.0944155,0.02215165,0.009363905,-0.008744828,0.017526725,-0.06711438,0.028548548,0.027309882,0.032590676,-0.04528501,0.009045053,-0.013889967,-3.2080417e-05,0.044157892,-0.0062750843,0.021195436,0.0027198216,-0.026330367,0.026978964,-0.025501398,0.010105445,-0.0072251526,0.041956164,0.04079632,-0.011168142,-0.0136637995,-0.013548358,-0.004666455,-0.03702117,-0.041824374,-0.033970673,-0.048732445,-0.03379033,0.0076733273,7.186658e-05,-0.021448264]	2026-09-08 09:32:54.310023+00
15	management	6	0	Tarbiya ishlari bo'yicha direktor o'rinbosari	Maktab rahbariyati\n\nErmatov Sanjar Toxirovich — Tarbiya ishlari bo'yicha direktor o'rinbosari. Bog'lanish uchun maktabning murojaat sahifasidan foydalaning.	/about	0f6762bc38fee579015d4aa92a7394c4598225e78a19ab38a006eeb6c98baf00	[0.021107223,0.011659725,0.021527724,0.0014915055,-0.020343529,0.026782723,0.027540153,-0.006052224,-0.013676739,-0.052991558,-0.009054737,0.006850906,-0.030362705,-0.0030422711,-0.018509429,0.014241245,-0.0049518757,-0.01618969,-0.019939432,-0.039170142,-0.0018310382,-0.008104371,0.034948964,0.017000075,-0.017118648,-0.017199581,0.022965329,-0.014625035,-0.030092824,0.22755045,-0.015177472,-0.0031758216,-0.03025269,-0.023452792,0.018120697,-0.00908806,-0.017174678,-0.0002952728,-0.027613295,-0.019590966,-0.008887733,-0.0014340437,-0.04971508,-0.027493669,-0.03791441,-0.054993987,-0.02726253,-0.01058104,-0.013248202,-0.022938203,-0.017285373,-0.014484638,0.008195139,0.014039725,0.010360292,0.037335616,-0.0021882923,0.016780112,-0.0020272338,0.005194962,-0.021876888,0.015953094,0.026535207,0.008638863,0.010551067,-0.0074108085,0.029288437,-0.013277548,0.000839403,0.02290476,0.021433683,0.04117181,-0.009219464,0.0033936494,-0.032838546,-0.009411216,0.021349788,0.011715194,0.03049697,0.05113665,0.0029532535,0.051686082,-0.030842224,-0.015061247,0.045530125,-0.020347895,-0.028902888,0.053697724,-0.01850095,0.047338918,-0.025685366,0.021567198,-0.04296235,-0.003955425,0.0041674646,0.045298476,-0.029311977,-0.010850692,0.0015415951,0.03697089,-0.004087324,0.022821944,0.054134473,-0.0044878335,-0.005196245,-0.052508075,-0.0008432296,-0.018097168,0.03084926,0.0034974064,0.010768649,-0.27461213,0.007329207,0.024299806,-0.06980418,-0.05616261,-0.009605359,-0.0016409119,0.050545204,0.0025744785,-0.001243555,0.015673853,-0.018409384,-0.0017919206,-0.0104003465,0.068600856,-0.019126862,0.03757656,-0.023027344,0.014863822,-0.0022736765,0.029088398,-0.017280921,-0.027964383,0.047694936,-0.031198133,0.0036368028,-0.015762473,0.0005241215,-0.010681648,-0.045729086,-0.013172455,0.009324776,0.007047061,0.021081932,0.005359621,0.037194263,0.0073486944,0.055473454,-0.029051453,-0.014586587,-0.0033723097,-0.014726395,0.024474377,-0.0102154855,-0.016832,-0.006063704,0.02789661,0.017143862,0.05026652,0.005960704,0.025534391,0.0053525628,0.004995726,-0.030240903,-0.036297094,0.021549342,0.028804308,-0.023887219,-0.0062020137,-0.006304269,-0.034071013,-0.0071249115,0.005153611,0.0029979667,-0.0047842367,-0.0048451563,0.0010916886,0.048483934,0.0806949,0.028540626,-0.0065120887,-0.02280177,-0.01829308,0.012420102,-0.0065938537,0.043511745,-0.023186075,0.0032607242,0.051346734,0.0062368885,0.05342028,0.012630625,-0.001680467,0.075801365,0.060204655,0.015709912,-0.013095845,0.012456993,-0.017656948,0.0051773437,0.00829214,0.06689351,-0.046995137,0.016656112,0.030578382,-0.012299868,0.03783682,-0.025400057,-0.050832063,0.0055887727,-0.0073618856,-0.018628672,0.010680509,0.04253217,-0.019982675,0.009579796,0.039793335,-0.0035442,0.014364198,0.039092615,0.00050253986,0.044637788,-0.014544576,0.002780393,-0.027343532,0.0054490245,0.0065058335,-0.002399294,-0.035418417,-0.0045544673,-0.027363881,0.009094933,0.0014958888,0.00801624,0.0012434134,-0.0011329275,0.04431138,0.05040456,-0.033092488,0.007174921,-0.015461203,-0.015338763,0.0023484544,0.0027362308,-0.031805795,0.01007882,0.04794246,-0.031562597,-0.0037964634,-0.019560412,-0.03094735,0.03329639,0.019190842,0.0018250465,0.033970237,0.007984403,0.013035257,0.022249136,-0.012629949,-0.0020349233,-0.03797591,-0.011493528,0.0024970484,0.0018737679,-0.016445193,0.011101035,-0.10687142,0.04819621,0.011619902,-0.012496755,0.042722348,5.753081e-05,0.0014680962,-0.0018579854,0.016129237,0.021375958,0.012221611,0.01101641,0.0054084365,0.009791847,0.012609681,-0.036427867,0.013582784,0.01294388,0.038426083,-0.06947681,0.07735026,0.008646271,0.039303403,0.031584498,0.035659757,0.009403462,-0.006281397,-0.03405263,0.0702932,-0.030195743,0.019306777,-0.007870445,-0.042174336,-0.037836146,0.013522086,0.0077212625,-0.009322997,0.012722627,0.029117774,0.01901772,0.014601204,-0.025127675,-0.009488891,-0.047991946,0.0148114925,-0.018720476,0.024633953,0.029268922,-0.03778845,0.005854388,0.011076937,-0.037261132,-0.16703123,-0.028940259,0.021785723,-0.02906454,-0.051732015,0.008286037,-0.01063143,0.0073790504,-0.04008876,-0.014017169,-0.021190858,0.024901293,0.0077832467,0.042059626,0.028236793,-0.02453019,0.019742638,-0.023256592,-0.059429135,-0.015446792,-0.04868209,-0.011969194,-0.34961385,-0.010598473,0.042039704,0.010606485,0.017947076,-0.0010854499,0.013260317,0.02050673,0.04051412,-0.005872275,-0.0011170206,-0.025195783,0.021798097,0.0034204284,0.036851373,0.018981516,-0.032965105,-0.022026394,0.021949677,0.00833862,0.014497531,0.01810925,-0.0044914302,-0.032717146,0.0067948056,-0.013992514,-0.010855822,0.011458367,0.0059488188,0.032522574,0.056505054,0.0140277,0.053551912,-0.015598033,0.0045820153,0.0069718435,0.0643657,-0.016674576,-0.0109411115,0.011794683,-0.025300307,-0.038471404,0.042428456,0.046601117,0.040134553,0.014795177,-0.037595127,-0.012003004,-0.01620742,0.02908296,0.062159233,-0.05444022,0.032542434,0.04052347,-0.036788903,0.0059470795,-0.026598068,0.011151472,-0.030732984,0.057451002,0.023846576,-0.027845247,-0.058680624,0.006525974,0.009632055,0.060071472,-0.0054812245,-0.032212853,-0.011409051,-0.037941363,-0.026545245,0.016002348,-0.0035691787,-0.027603168,0.02553472,-0.026467523,0.034835342,-0.004687356,-0.0025679206,9.415231e-05,-0.033325892,0.025521893,0.012789744,0.03490322,-0.028097006,0.022883242,-0.004616548,-0.0129845245,0.01928809,-0.04229797,-0.035258166,-0.025956852,0.017812973,0.04551094,-0.03324574,0.0005124958,-0.01681928,0.022521239,-0.0069528157,-0.02327779,-0.00059966237,0.06646917,-0.08388956,0.043335304,-0.02718101,-0.022190299,-0.027731398,-0.05318679,0.023279762,0.021979846,-0.007965006,-0.027587533,0.018924797,0.010704414,-0.04881032,0.004868676,0.011165566,-0.02886971,-0.010927388,-0.01316814,-0.021321775,0.0088004945,-0.0028372884,-0.0067313616,0.0073756776,0.008179971,-0.016091123,0.06706151,-0.02909486,-0.008075593,-0.013917533,0.011236395,-0.003092769,-0.020979445,0.0363398,0.0021338675,-0.016641809,0.046633035,0.021254696,-0.009883833,0.0004956313,0.018074835,-0.0030113913,-0.0069010276,-0.045833454,-0.021188369,-0.010380948,0.04592073,-0.009356925,-0.011912703,-0.002266691,0.0031479814,-0.038453978,0.002752949,-0.002235614,0.003822573,-0.0008554979,0.019704042,-0.03750699,0.04835111,0.0022228356,-0.07148733,0.039804623,0.011594983,0.0309367,0.0052149817,-0.2889821,0.01621081,0.0080535365,-0.025279885,-0.010719898,-0.033032887,0.023213668,0.0054651517,0.034168813,-0.030109743,0.046946697,0.04249687,-0.08280383,0.03874979,0.020401187,-0.0031291978,-0.03618812,-0.012685441,-0.0034047558,0.006951633,0.025165327,-0.042383246,-0.048991237,-0.06909657,0.042599287,-0.048981495,-0.0068080043,-0.021112652,0.0031383645,0.045365557,0.029296214,0.00028333353,-0.01659988,0.0068307677,0.014554881,-0.026091157,0.01960238,-0.030302173,0.03149475,-0.008890168,0.022281367,0.031349067,0.0007093476,-0.026629454,-0.011830338,0.02604893,-0.008018056,-0.11230155,-0.010827818,-0.020427363,-0.009237421,0.030576833,-0.010598905,0.0025943762,-0.012512838,0.002050175,0.024729617,-0.028413553,-0.022368623,-0.010150593,0.005490956,-0.026216233,0.0075296196,0.028607106,0.03369226,0.028899016,0.04566863,0.14472857,0.010423498,-0.007803974,-0.024918297,0.02949009,-0.015201178,0.011561701,-0.0019663766,0.015233317,-0.011102878,-0.006416801,0.0112864,0.06374924,-0.00042392378,-0.0028068537,0.040586025,-0.009199653,-0.010598551,0.05607523,0.033147637,0.03247392,-0.016859287,0.0069507137,-0.031430464,-0.0127342325,0.05567854,0.016132522,-0.025995517,0.027034717,0.002136945,-0.0033405293,-0.006404045,-0.0023907234,-0.09656336,0.043849256,0.015304883,-0.0045746365,0.0072215563,-0.0035427539,0.02827947,0.017033359,0.023963239,0.039572783,-0.0076854946,0.03234416,0.021819646,-0.02803852,0.0050527174,0.016489062,0.04039751,-0.009522039,0.00027708913,-0.01386743,-0.04638816,0.00041693464,0.007840534,-0.0042694816,-0.047559224,-0.011293958,-0.004210545,-0.020861411,-0.018052615,0.048969727,0.01761458,-0.0038765967,0.013304736,-0.0033374673,0.0035512473,-0.04485861,-0.01277539,0.02055613,-0.016609615,-0.027696302,-0.041263573,-0.056486152,0.026055697,-0.02401869,0.014713157,-0.026118707,-0.0360937,-0.0020180428,0.03861772,0.005093954,-0.03503034,0.02212815,-0.017079486,-0.015857274,0.03489813,-0.05179696,0.027117288,0.028026916,-0.03817873,-0.024709042,-0.007026043,0.0076825633,0.0005426264,-0.012121731,-0.0057494957,-0.020100975,0.019856127,-0.019624183,0.018348893,-0.02910557,0.017510021,0.024759343,0.0035242033,-0.0019347192,0.04443252,0.0050929906,-0.024309926,0.05304664,0.007877493,0.00035229535,-0.023510508,0.021438133,0.0016877264,-0.0347819,0.0887546,0.025933763,-0.01668355,0.016209332,-0.027500076,0.058465783,-0.032040052,0.0032672288,-0.028856266,0.07948042,-0.0026296764,-0.0037127808,0.036823917,0.019414118,0.02178596,-0.017343046,-0.023500282,-0.047958657,-0.023263779,-0.02131783,-0.03741374,0.06970861,-0.06045023,-0.022412742,-0.026481548,0.023613302,0.013095849,-0.021799693,0.00653935,0.033244632,-0.0017694549,-0.00456719,-0.0027514482,-0.009737961,-0.019852905,-0.016653923,-0.013643108,-0.04230935,-0.006861936,-0.038729217,0.02979336,0.09312106,0.018456334,-0.008011756,-0.02972534,0.015367065,-0.045607045,0.012494179,0.0677078,0.030704742,-0.06675408,-0.01579629,-0.0006240262,-0.0016974456,0.006226787,0.021967884,0.01158274,0.0007112733,-0.009748231,0.03474541,-0.013938932,-0.022594137,0.009530369,0.03199302,0.009638736,0.009602981,-0.0024748733,-0.009396278,-0.017727507,-0.055648856,-0.03782137,-0.031885393,0.0031986244,-0.010681388,0.019171404,-0.0011684845,0.014131477]	2026-09-08 09:32:54.310023+00
16	news	3	0	Ota-onalar yig'ilishi 15-sentyabrda bo'lib o'tadi	E'lon: Ota-onalar yig'ilishi 15-sentyabrda bo'lib o'tadi (2026-09-06)\n\nBarcha sinflar bo'yicha umumiy ota-onalar yig'ilishi 15-sentyabr kuni soat 15:00 da maktab yig'ilishlar zalida o'tkaziladi. Kun tartibida: o'quv yili rejasi, ovqatlanish masalasi va sinf jamg'armasi muhokama qilinadi.	/news/ota-onalar-yigilishi	ab22e14cfe72efb2771e9732f08b2ee6d22143b218916060ffe90fa922349886	[0.001327053,-0.017682098,-0.0012093746,-0.003980994,-0.015204447,-0.02400992,0.0024898748,0.02308292,0.020462653,-0.09036748,-0.005062311,0.032976612,-0.032702144,0.0049161487,0.016838448,-0.000463828,-0.022415103,-0.010443045,-0.0008155443,-0.058121387,-0.0027207755,-0.00044887184,0.041122247,0.04890538,-0.0005408297,-0.022965683,-0.031542487,-0.004432257,-0.015537234,0.23932286,-0.008990123,-0.005985575,-0.0105747795,-0.016090194,0.066015504,-0.02524925,0.0187533,-0.023829088,-0.011954773,0.051470883,0.006375371,-0.01681389,-0.0038467888,-0.0031173946,-0.049510054,-0.021116607,-0.012255607,-0.016100084,0.028449733,-0.02517362,0.045484893,-0.04017699,0.04925119,0.02963526,0.020901283,0.018712647,-0.046827525,-0.0063413195,0.038673844,0.017860582,-0.01119843,0.024037492,-0.005629553,0.013001773,0.002860508,0.013763858,-0.0110477805,-0.018220488,-0.0109718535,-0.024309263,0.013014819,0.0014674844,-0.013768353,-0.0076964935,-0.010639812,-0.019415189,-0.01950788,-0.012102748,-0.018768815,0.043380857,-0.025194073,0.020194255,-0.031303734,0.009032972,-0.0038296785,-0.008273969,0.014039414,-0.0037743258,-0.052628826,0.0034331142,0.004777099,0.004160215,-0.0037808125,-0.03455522,0.018259022,-0.011307912,-0.04350712,0.01288222,-0.009401498,0.018257346,-0.004026139,0.0033508954,-0.033751912,-0.0065738573,0.025174648,-0.046185207,0.011665326,-0.015273957,-0.0040928987,0.020138668,-0.03485568,-0.29288045,0.008764905,0.034955677,-0.043773767,-0.0519719,0.024829108,0.014228502,0.08903667,0.052635215,0.015439049,-0.0027844487,-0.016119458,-0.030742453,-0.019726817,0.025739133,0.043651886,0.008236786,-0.025849812,0.012135661,-0.012915852,0.04177776,-0.022496572,-0.014263601,-0.007392754,0.017639888,-0.022067547,0.008751804,-0.0028288504,0.007084704,-0.024260366,-0.018862367,-0.0020930986,-0.03175106,-0.00020153508,0.013228239,0.0013158134,-0.00024264742,0.04994437,0.016782762,0.01845922,-0.011594315,-0.02865808,0.00064363156,0.030925106,-0.035963185,-0.030255169,0.019542113,-0.015385726,0.064210795,0.0068304227,0.022847848,-0.019261483,-0.021459913,-0.050519567,0.033144765,0.015539374,0.012555354,-0.009428762,-0.05278265,-0.031516336,0.05430556,0.012444208,-0.036809437,0.012942826,0.013199542,0.053309213,0.004240797,0.03628888,0.018505828,0.019264178,-0.041471444,-0.042621676,-0.0007448236,0.010151607,0.025018577,0.028469322,-0.0011361113,-0.0027300029,-0.010440093,0.008526919,-0.010017142,-0.005205314,0.009821924,0.039263066,-0.0027726968,0.038916513,0.0117030265,0.020610983,-0.017008558,-0.005108529,0.011564733,0.030053517,-0.022396654,-0.030871054,-0.041639216,-0.013360534,0.015963906,0.0017745929,-0.06220391,0.015074105,-0.009368229,-0.032380316,-0.014914483,-0.0022250153,0.0063375235,0.018830257,0.045695398,0.0071251253,0.036148835,0.03768462,-0.0034874,0.020412933,-0.0040443274,-0.005423214,-0.038553707,0.01697833,0.001257631,0.02876102,-0.008260069,-0.0135469595,-0.0028564436,-0.00855024,0.0011410156,0.0142723285,0.014458994,0.054833423,0.048220884,0.0033532714,-0.008535024,0.014338294,-0.0060808966,-0.017418096,-0.010457295,0.0057021515,-0.00064106786,-0.011675895,-0.01010826,0.014352906,-0.028245261,-0.011915069,-0.005317796,0.00043145844,-1.5616422e-05,-0.0043292986,0.015658146,0.027269451,-0.008722955,-0.0028454014,-0.05017536,0.011837349,-0.018589683,-0.02331464,0.028201785,0.053487223,0.013083724,-0.0029688533,-0.06969149,0.06083837,-0.0009764048,-0.008423178,0.043052435,0.011055473,0.004861079,0.024408465,0.08906346,0.013748583,-0.010590187,-0.022642836,-0.07065898,-0.008249767,-0.04825956,-0.04049797,0.014636123,0.010903565,0.020496646,-0.014841098,0.008376484,0.049870174,0.015795946,0.025625808,0.036193114,0.028506612,-0.004110717,-0.021490682,0.035563715,0.025615422,-0.03879322,-0.038356304,-0.020078775,-0.0651635,0.020935396,0.018127905,-0.03401371,0.011466027,-0.0028124868,0.008801732,0.011272308,0.029926723,0.0131924655,-0.013772152,-0.016077146,-0.031408045,-0.0028218043,-0.0014107494,0.011299674,-0.017440423,-0.026874132,-0.010290726,-0.17574576,0.052139785,-0.0027742623,0.015093513,-0.03521671,0.019395947,0.0062386,-0.05886101,-0.048336927,0.011904595,-0.047698885,0.007871128,-0.0025417416,0.020698328,-0.015208342,-0.015440875,0.022470504,-0.05012445,0.017962614,0.00600047,-0.026932364,-0.01577526,-0.32440972,-0.0066123917,0.028332694,0.06321017,-0.01479667,-0.0007061472,0.032367364,0.03505823,0.052227184,0.0062261936,0.045791376,0.0015609235,0.054083943,-0.01946391,0.056208197,-0.032118183,-0.0056876005,-0.0035218843,0.036048938,-0.014057282,0.026112352,0.017091373,-0.0042453185,0.0037469908,-0.0033520723,-0.052959632,0.050900996,-0.01622338,-0.008823699,0.017537141,0.02938387,0.010415731,0.03191857,-0.029737828,-0.0027692355,0.02899656,0.045625236,0.003058048,0.0077444455,0.052433316,-0.04771516,-0.009915488,0.0018246337,0.051791493,0.049730048,-0.029492112,-0.0012785693,0.0061108377,-0.03977183,0.022289429,0.06500778,-0.016286978,-0.016092323,0.014065311,-0.0034815741,-0.022554802,-0.052033775,0.010575749,-0.045642976,0.028798992,0.0120512955,0.021751404,-0.048706047,-0.012238257,0.0018314485,0.030627007,-0.012026539,-0.0568632,-0.03592376,0.0030110278,-0.0633461,0.026788294,-0.053446297,-0.0104430495,0.02352674,-0.048507392,0.06298088,0.018496485,-0.034573518,-0.006707513,0.0042333086,0.02727363,-0.02072225,0.019716656,-0.031279925,0.021222465,0.0058435886,-0.0015477766,0.037068248,-0.03180879,-0.04337867,-0.0018121909,-0.001924414,0.04352057,-0.018885735,-0.0030765603,-0.027755748,0.03639889,-0.018110884,-0.019179553,0.018073566,0.021303767,-0.051691815,0.02551498,0.03165358,-0.00457372,0.032777768,-0.02859016,-0.022210734,0.090693854,0.027419781,-0.0077568865,0.014831715,-0.001650555,-0.018257773,0.002781136,-0.018608503,0.023808563,-0.0037363942,0.005539065,0.010752126,0.027451158,0.027792137,0.013265855,-0.0036913587,-0.00073686347,-0.0004675296,0.040530834,-0.022032617,-0.011976643,0.024385406,0.016698675,0.062075257,0.01100478,0.04559078,-0.023826603,-0.0006547431,0.013395485,-0.016577972,0.014018546,0.02095116,-0.016301667,0.0047142208,0.010078632,-0.0498676,-0.031162634,0.0272429,0.060029395,-0.0010571748,0.0032084764,-0.019726856,-0.037813563,0.025564732,0.035274725,0.02116618,-0.008519436,0.004568657,0.048334,-0.023524314,0.050542835,0.047845006,-0.020144934,0.0051925257,0.021795275,0.012486977,-0.03966314,-0.29082537,0.038068734,0.025546843,0.017670378,-8.031689e-05,-0.034985688,-0.036780354,-0.01943578,-0.031435814,-0.004957948,0.031594597,0.008033814,-0.038657226,-0.02164659,0.01364695,-0.03224635,-0.0027266613,0.014543436,-0.055822663,0.004313651,-0.009360164,-0.009543798,-0.028039007,-0.043239176,0.016992861,-0.047473267,0.015555689,-0.0030313933,-0.010493131,0.011754795,-0.023390146,0.008299154,-0.028358221,-0.01170639,-0.0117818285,-0.033271752,0.027392251,-0.029992247,-0.005458891,-0.0137786195,-0.039658267,0.056586154,-0.020137636,-0.008883627,0.0013055288,0.024877613,0.032294415,-0.1323642,0.010926151,0.009374773,-0.004810761,-0.0015374969,-0.053167492,0.02992737,0.0039208257,-0.017115898,-0.01628642,-0.04365692,0.00027520026,-0.036393467,0.03622546,-0.018536853,0.0053339684,0.0072755967,0.01718497,0.012531435,-0.0016435792,0.16074127,-0.057139613,-0.00023797354,-0.016949268,0.035312403,0.005468056,-0.006967886,0.024420967,-0.01348569,0.0038150814,-0.0013492071,0.008202771,0.0030504675,-0.016085144,-0.0295886,0.016727641,-0.024229458,0.012696177,0.024962092,0.0378911,0.012967299,0.024803977,-0.008214826,0.018101702,0.021103552,-0.016091323,0.016312113,-0.0035538683,0.05184152,-0.020557884,0.0169861,0.038607106,0.04784751,-0.056344528,0.0025887375,0.025127197,-0.015973555,-0.0030002764,0.010170363,0.0054895617,0.033793326,0.02804815,-0.01843027,-0.056214537,-0.015182042,0.034228873,-0.019479662,0.02663336,0.015794408,-0.013054284,0.0023305314,-0.03981625,-0.0334041,-0.025834827,0.022888497,-0.019833008,-0.015069204,-0.047333732,-0.0263093,0.01785363,0.0028192545,-0.0073539037,0.07650026,-0.036145,-0.0077931923,0.038908564,-0.029381333,-0.00722342,-0.021249022,-0.0048919125,-0.011896057,0.0064018383,-0.019068826,0.008216478,-0.0119523555,-0.028719546,0.0125976475,0.05420878,-0.03162304,-0.0140892565,0.031075101,0.0045045004,-0.019330014,-0.02828038,0.022468103,0.02818413,-0.021095626,0.0061952495,-0.024903314,-0.0032446685,-0.0046305438,-0.0067388937,-0.016093774,0.010942855,0.021788573,0.0027982257,0.0034301176,0.031501852,-0.047324307,-0.025718944,0.022191541,0.020959713,0.025318865,-0.010825139,0.0074335006,0.0086115915,-0.005359166,0.009509595,0.043856718,-0.036480926,0.032723885,0.03950041,0.039119076,-0.024658203,0.032149844,0.023165567,0.011850415,0.07027715,0.046157844,-0.0114521375,0.03455753,-0.02623799,0.06632545,-0.0315781,0.044957925,0.0059756786,0.042397644,0.007480594,-0.008702893,0.017440202,-0.025104407,0.021549763,0.019043757,0.0024606658,0.0064455816,0.023636343,-0.008411761,-0.08747099,0.034044117,-0.024171913,0.003560925,-0.0086356,0.025154406,0.017021494,0.029006787,-0.011498581,0.0018130449,0.0067036706,0.0226833,0.07058716,-0.022340713,0.03449245,-0.053238157,0.0009854927,-0.03301464,-0.0073620267,0.02586574,0.022199865,0.09806589,-0.0032233298,0.017161503,-0.072741285,0.044680167,-0.031331647,-0.03939183,-0.00051153795,0.0030564046,-0.022292113,0.017447202,-0.013952336,0.033280525,-0.00871314,-0.0024623678,-0.005037738,0.025757518,0.052528217,0.034147058,0.0011230939,-0.021609284,-0.01771254,0.045309834,-0.015069386,0.005340226,-0.03592581,-0.006710685,-0.009386582,-0.03326074,0.011514909,-0.037240334,0.0045298166,-0.016998507,0.02662247,0.032331172,0.029647328]	2026-09-08 09:32:54.310023+00
17	news	1	0	2026-2027 o'quv yili tantanali ochildi	Tadbir: 2026-2027 o'quv yili tantanali ochildi (2026-09-03)\n\nMaktabimizda 2026-2027 o'quv yilining birinchi kuni tantanali marosim bilan nishonlandi. Marosimda 142 nafar birinchi sinf o'quvchisi ilk bor maktab ostonasidan qadam qo'ydi. Tadbirda tuman hokimligi vakillari, ota-onalar va faxriylar ishtirok etdi. Direktor o'z nutqida yangi o'quv yilida raqamli ta'lim yo'nalishiga alohida e'tibor qaratilishini ta'kidladi.	/news/oquv-yili-ochildi	d318ef5a53dd3da788e1a359520faa1063a0f20b1cde53d651aaaeb99a6a140c	[0.013633475,0.012707072,-0.022252366,0.011483125,-0.020062124,0.0034758763,-0.036741596,0.0058221365,0.013496496,-0.095769875,-0.024763312,-0.0011266231,-0.033985395,0.008422036,-0.007769716,0.028508756,-0.04362602,0.010790041,-0.0059676976,-0.0509055,0.007623142,0.029236838,0.018481182,-0.0050233817,-0.002654554,-0.03069507,0.0018267009,-0.03152496,-0.015324112,0.24304499,0.030806657,-0.036924515,-0.012319351,-0.015381248,0.035359226,-0.008867827,0.005917006,-0.0131003475,-0.009832576,0.073688865,0.018285172,-0.010136026,-0.019509152,-0.011156318,-0.019602528,-0.008218094,-0.008982119,0.016637567,-0.006313198,0.010844534,0.014538027,-0.055185966,0.016631635,0.012295226,0.037413843,0.044161882,-0.00742052,-0.014830477,0.02287682,-0.020218754,0.01070097,0.01728399,0.011203852,0.023918735,0.00072685804,-0.033570565,0.03482921,-0.022322197,-0.025736537,-0.021593187,0.008404906,-0.0052278345,-0.004741583,-0.014228439,-0.009884622,-0.016884739,-0.01655394,0.04430204,0.02137037,-0.025999593,0.01030342,0.014461421,-0.06500333,0.022843098,0.02410963,0.004299564,0.034544952,0.017907828,-0.032825604,0.0074521806,-0.0017760235,-0.0012078638,-0.028829245,-0.00034233066,0.008933486,-0.012608981,-0.005717013,0.013896426,0.012635198,0.020873232,-0.034161787,0.0083158845,-0.013075918,0.015757103,-0.007277185,-0.044284172,0.0073312446,0.005748637,0.025010012,-0.00813613,0.014327925,-0.30953327,0.026711807,0.02155375,-0.06241248,-0.04830373,0.03553853,0.03517405,0.082938135,0.027149722,0.05680954,0.025129577,-0.01050179,-0.028968811,0.021703353,0.029870728,0.0114025185,0.004988652,-0.039136466,0.0012669413,-0.02341511,0.04449234,-0.01706478,-0.00807702,-0.002560202,0.024746375,-0.020135814,-0.0059472662,0.019621862,-0.0153022995,0.009815086,-0.004674433,0.000943116,-0.013271561,0.006656179,-0.0031167555,0.01917795,0.038060565,0.06795536,0.010038058,0.0068141166,-0.034826998,-0.012014524,0.0045401547,0.0122429505,-0.029777285,-0.039662316,0.025611935,-0.020615865,0.068666086,-0.013678953,0.010668477,-0.00092636445,0.048218407,-0.015959995,0.006186538,-0.0090870345,0.0065029915,-0.031810384,0.012251452,-0.018474687,0.02075332,-0.022450514,-0.004506326,0.0039391466,0.025339603,0.01671713,0.006389116,0.03213248,0.030289914,0.02835222,-0.006201233,-0.02175724,-0.0056270156,0.0035992377,0.0016774173,0.033849638,0.00956276,0.021218024,-0.027034452,0.013396821,0.039948817,-0.00052052806,0.025977205,0.038803305,0.007376033,0.028104339,0.003369169,0.0371362,0.015036491,0.016832637,-0.02218081,0.015171549,-0.031846456,-0.0051462185,-0.031038204,-0.013090254,0.040949974,-0.027031822,-0.034561615,0.019141164,-0.021117968,-0.028161267,-0.022053825,0.02124322,-0.038610756,0.05014712,0.020891482,0.0026535976,0.008349122,-0.016520524,0.00253044,-0.005289966,0.011542914,-0.010774574,-0.0053028716,0.026044548,-0.0059885737,0.0074480907,-0.011143185,0.01632739,-0.008531355,-0.0015287723,-0.03428809,0.012538238,0.0045005986,0.037810322,0.026114013,0.024308749,-0.02050774,0.019455316,0.008705548,-0.0010879893,-0.014741222,0.02758634,-0.011702403,0.02108764,0.004696175,-0.052884467,0.0009166484,-0.013414894,0.020398729,0.0009134156,-0.024074094,0.037345927,0.024541443,-0.012748046,0.0030137198,0.014676907,-0.10184937,0.015267377,-0.022882748,-0.04196064,0.034570415,0.03177484,0.023773208,-0.013244901,-0.051693063,0.09440482,0.0012581701,0.007462135,0.041503273,0.036949653,-0.02054079,0.043240502,0.03039645,-0.008948472,-0.021351846,-0.03226882,-0.019035216,-0.013281045,-0.020310631,-0.021042181,-0.009666604,-0.019302256,0.022160769,-0.024177339,0.014737376,0.027575396,0.020280115,0.03128704,0.016992716,0.029871093,0.047902286,-0.035203382,0.042282302,0.041031748,-0.0208103,-0.02373078,-0.0053730006,-0.013830733,-0.00021311197,0.021686163,-0.013744257,0.012724029,0.042724505,0.025126662,-0.0021474056,-0.029177796,0.019919172,-0.0304204,-0.019338677,-0.029935224,-0.004510169,-0.01038342,-0.038624994,-0.042600952,0.0041422024,-0.0052736015,-0.17129397,0.0055277334,0.011852082,-0.013328021,-0.031611323,0.042136364,0.026860133,-0.04129306,-0.03724201,0.018904498,-0.035547648,0.00241966,0.014439267,0.038137205,0.036814906,0.009082886,0.008043903,-0.061858542,-0.00590637,0.00011649611,-0.012289549,-0.026595945,-0.34744307,-0.01587942,0.028604338,0.034212172,-0.009442512,-0.0003318536,0.048667956,0.029629335,0.031982098,0.0028228979,0.010369046,-0.014610228,-0.027903719,-0.03232169,0.041888546,0.0074613173,-0.021704951,-0.023101939,-0.007768468,-0.025500515,-0.0022907243,0.022034917,-0.029253252,-0.020032454,0.031870775,-0.022537386,0.046147153,0.039318528,0.00997293,0.0349671,0.03544087,0.023184894,0.047381707,-0.047045834,-0.021946086,0.030576915,0.010033775,-0.004098542,0.0039965464,0.030944405,-0.039395746,0.029405331,0.040249065,0.069972806,0.034537062,-0.035637446,-0.011862668,0.03010562,-0.044118185,0.0014539411,0.052622005,-0.012292214,-0.012611847,-0.0026294517,-0.038371626,-0.032414984,-0.018635577,0.023254143,-0.05298963,0.012363207,0.005425083,0.044296317,-0.027223112,-0.00022932682,0.011998333,0.023977237,-0.0022427994,-0.035295703,-0.061461292,0.006638167,-0.0509768,0.022438735,-0.009005392,-0.004321613,0.045301307,-0.011471437,0.04358884,-0.0028608514,0.0024175304,-0.040836826,0.007585402,0.017688794,-0.030182326,-0.00032834715,-0.040539224,0.012107077,0.014568391,0.02637896,0.010574392,-0.054551676,-0.045233797,-0.005559118,0.0050431294,0.033020083,-0.04903304,0.0366641,-0.05376349,0.039860256,-0.006046137,-0.01663097,0.012205581,0.029229822,-0.049679466,0.040935084,0.037678335,-0.01578291,-0.011601659,-0.04157083,-0.011518555,0.06951572,-0.0040703462,-0.018386094,0.008783393,-0.012596652,0.022080421,0.0040837927,-0.006031143,-0.0021742196,-0.024999654,0.010178041,0.005808606,0.008438567,0.018823327,-0.024998544,-0.017421214,0.0017099124,-0.033562984,0.03648519,-0.047746517,0.0039479644,-0.0063362923,0.010083829,0.05434458,0.010196333,0.026367588,-0.03237163,0.0011180438,-0.017691819,-0.0024454645,0.022298833,-0.006976945,-0.009483832,0.010178094,0.010182021,-0.047419667,-0.005224285,0.006890519,0.05076977,0.015795315,-0.00993874,-0.020225503,-0.06987677,0.0319081,-0.007218163,0.0026122953,-0.011723911,0.023086786,0.003675122,-0.011817875,0.08128058,0.01427235,-0.010490173,0.005248295,0.025665523,-0.025259404,0.008368105,-0.28811014,0.009656266,0.03119268,0.021493599,0.017538128,-0.037497073,-0.004485277,-0.036683936,-0.007837857,-0.008661442,0.039237905,-0.012265286,-0.04301017,0.0023118982,-0.019791111,-0.0053505395,-0.025867922,-0.008719849,-0.032174926,0.0029556304,-0.003141366,-0.0010368146,-0.041742742,0.0039264914,0.01463605,-0.037526917,0.013210957,0.020652011,-0.0034545234,0.017364826,-0.054956656,0.039065804,-0.056817606,0.0055108974,-0.044711426,-0.029898966,0.027587473,-0.011831986,0.019094516,-0.021082612,0.013509736,0.07576718,-0.036884665,-0.039488167,0.008464258,-0.012775588,0.030651277,-0.12728114,0.005039009,-0.007666029,-0.01897326,0.0056471005,-0.023090906,0.023411546,-0.030680997,-0.026180908,-0.0038839274,-0.041922376,-0.03628637,-0.016329769,0.046250757,-0.011540455,0.03590363,-0.02599286,0.035097726,0.0061910558,0.020435564,0.14607535,-0.019775398,0.022091676,-0.006095126,0.030135881,-0.010773026,-0.0035710107,0.0005074242,0.015872478,-0.026685908,0.0069837915,-0.01810052,-0.008942267,-0.0038275095,-0.01669823,-0.0017285674,0.006891649,0.01193893,0.08998463,0.055990852,-0.0008421173,0.0095452,-0.021531342,0.008543558,-0.0006470014,-0.020224895,0.018327652,-0.014528465,0.020621378,0.013928548,-0.01287426,3.5626705e-05,0.042572934,-0.070613556,0.023527415,0.05164434,0.026936615,-0.01361896,0.012717546,0.045419633,0.015067282,0.01641051,0.019554824,-0.0478121,-0.0022854072,0.012382303,-0.015131754,0.024277419,-0.008181535,-0.008506354,0.013982568,-0.018532533,-0.037785742,-0.0089610685,-0.0082885,-0.052402433,-0.024405612,-0.019684931,-0.015136481,0.033650372,-0.00092123426,-0.017403254,0.062834084,-0.0060374993,-0.020978978,0.056227993,-0.0045294133,-0.0052991784,-0.033706404,-0.007931926,-0.00198144,0.0037725954,-0.016653685,-0.040801328,-0.0029857084,-0.059388217,-0.017713107,0.0009280187,0.0126313595,-0.01810071,0.029525844,0.0027380383,0.014245479,-0.02600578,0.02037051,-0.06404032,-0.00477416,0.026964175,-0.029914035,0.011961354,0.009369664,0.0037101198,-0.013383037,0.03731847,-0.0027230307,0.0050735283,-0.016733624,-0.0012888649,-0.03909205,-0.020387879,0.016702985,0.025781574,0.031852875,-0.005149303,0.015082622,-0.0010063584,-0.0005865268,0.0074044922,0.026757129,-0.025501397,0.046819866,0.018203864,-0.018478073,0.01666645,0.0041036303,-0.014493054,-0.0046840613,0.037727796,0.038271766,-0.0276841,0.03983715,-0.0057518566,0.035873014,-0.055945024,0.0036852264,-0.0048714923,0.04832697,0.026278263,-0.04632372,-0.00050860766,0.020277722,0.008991785,-0.013347051,-0.023058072,0.0062909382,-0.010480222,-0.012723568,-0.0798417,0.027414134,-0.04198989,-0.041443646,-0.038348045,-0.011518909,0.005214678,0.011953552,-0.00901529,-0.022760505,0.023593033,0.027883017,0.06382979,0.02793411,0.0346205,-0.026510153,-0.0130487485,-0.008132961,-0.023823345,0.0130546205,-0.0012668438,0.090572536,0.010762404,0.014192689,-0.03738196,-0.008967458,-0.055431772,-0.03193643,0.010172648,0.033632923,-0.033223588,0.008140496,0.0044812597,0.039376106,-0.0053648455,-0.001078545,-0.009137636,0.04013,0.017452754,-0.006011077,-0.015399335,-0.024483912,-0.018489998,0.060334958,-0.011917674,-0.043952454,-0.042153616,-0.0015610885,-0.006466054,-0.01333436,-0.025187224,-0.035501644,-0.033464674,-0.03636546,-0.027069982,0.016898049,0.0062764706]	2026-09-08 09:32:54.310023+00
18	news	4	0	Ingliz tili to'garagi ishga tushdi	Yangilik: Ingliz tili to'garagi ishga tushdi (2026-08-29)\n\nMaktabimizda 5-9 sinf o'quvchilari uchun qo'shimcha ingliz tili to'garagi ochildi. Mashg'ulotlar har seshanba va payshanba kunlari soat 15:00 da o'tkaziladi. To'garakka yozilish uchun sinf rahbariga murojaat qiling.	/news/ingliz-tili-togaragi	95439c42865c22d63175ae6a1c73ff1f936be3aeb711e36edb6980c0a2b9dbb7	[0.006790629,-0.024165235,0.011988949,0.009241228,-0.014158913,-0.021992095,0.006162639,0.0013400278,-0.016021552,-0.082448035,-0.02688701,0.018997798,-0.03956598,0.00656734,-0.03267869,0.003240625,-0.03759777,0.02205495,-0.0058009,-0.018328553,-0.039578736,0.013804174,0.0075547993,0.040791582,-0.010227166,-0.038376406,-0.012799657,-0.016291467,-0.005373145,0.20897241,-0.013819621,-0.03271341,-0.0043657334,-0.017800894,0.04591588,-0.021595923,-0.00024855856,-0.03532407,-0.019597959,0.020702891,-0.008115811,-0.05370619,-0.013601864,-0.032709364,-0.0459906,0.03237055,-0.012459549,0.012693385,0.002692765,-0.017223047,0.032231163,0.00022059496,0.013679618,0.017100435,0.034184877,0.014645736,-0.029308766,0.003886939,0.05906343,0.033606503,0.017845366,0.030499415,0.04275584,0.01420642,-0.002338637,-0.006137257,0.010244686,0.008004934,-0.00068856624,0.0016661253,0.0062133255,0.024811534,-0.020785963,0.002057763,-0.034609478,-0.018782942,-0.011146452,-0.02475499,0.022030858,-0.0046178563,-0.015973354,0.049792185,-0.037415113,0.004201345,0.019242303,0.006795325,0.025161354,0.036898773,-0.06624332,-0.005951085,-0.021205876,-0.001381452,-0.02173299,-0.032851685,0.012004784,0.007941158,0.027532462,0.014314053,-0.021650981,0.03891145,0.0038226997,-0.02734005,-0.011088393,-0.032218788,-0.0044817235,-0.02967357,0.00799163,-0.009722899,0.017695762,0.050298765,-0.010157657,-0.3019441,0.019129451,0.015227636,-0.037253153,-0.041245613,0.011776523,0.019066945,0.08031296,0.03878803,0.035159368,0.018730504,-0.008215226,-0.017008796,-0.02950617,0.021701165,0.0015092136,-0.004453582,-0.029654678,0.0026155524,-0.018100904,0.052962247,-0.013893618,-0.0013265753,0.008404835,-0.019336987,-0.00677703,-0.00999651,0.010604907,-0.0074898335,-0.02977095,-0.009776849,0.004631069,-0.012646006,0.019914359,0.035289448,0.042266257,0.018873902,0.0432859,0.025115816,0.007936371,-0.015839493,-0.002610922,0.00519666,0.0047218907,-0.035260886,-0.038212936,0.035544395,-0.016182745,0.033937458,-0.014258063,0.016527217,-0.02943187,0.027955638,-0.026108166,0.02986365,0.0037570733,0.014383143,-0.02055932,-0.032585323,-0.0416765,0.039118744,-0.015065165,-0.007688216,0.023575626,0.00053866825,0.039567634,0.0018358676,-0.00496821,0.020869553,0.02716959,-0.03419128,-0.016602144,0.037371054,0.019342275,0.008746252,-0.026023509,0.019220274,0.0010801229,-0.00667757,0.0003629498,0.02265772,-0.004229292,0.0028973515,0.04495082,-0.01654222,0.05496093,-0.03698284,0.013200831,0.002216931,-0.01956096,0.008059866,0.042540066,-0.048416402,-0.008387844,-0.026846124,0.016517228,0.0016575961,-0.015699387,-0.067853235,0.01872693,-0.023592135,-0.02601541,-0.03849333,-0.00843755,-0.03191284,0.020254903,0.021189386,0.012195725,0.004859599,0.02913529,0.000103516584,0.009389643,0.005575631,-0.022370543,-0.042471413,0.048936237,0.0029454923,0.028235326,-0.010135873,-0.034978915,-0.015297635,0.0040281904,-0.02436796,-0.014169088,-0.024299448,0.02404076,0.030027732,0.0019971724,-0.026117463,0.015747631,-0.019196471,-0.023638738,0.0020002492,0.018928397,-0.012133902,0.0081489105,0.034172617,-0.019822916,-0.06394288,-0.019448074,-0.018658739,0.011592368,-0.022461696,0.03628166,0.027536966,0.0106946,-0.02096273,0.022347335,-0.04367367,0.0232387,0.009602241,-0.037251525,-0.0025552646,0.050051562,0.0255044,-0.024609677,-0.046136755,0.0396736,-0.002441205,-0.0047119735,0.023955885,0.0042732293,0.0001664891,0.045174703,0.061379246,-0.0018810167,-0.019464757,-0.04175289,-0.041847385,-0.0005091549,-0.015335306,-0.01941504,0.010023343,-0.009185819,0.02813503,0.0049891635,0.01982318,0.027939288,0.039325684,0.040609717,0.058637016,0.031961415,0.010119777,-0.032172695,0.050526615,0.008662965,-0.020049384,-0.040025026,0.018394912,-0.029334234,0.03743668,0.011750759,0.0017308051,0.025383603,-0.008742934,-0.007567952,0.0071946657,-0.011947405,0.025750732,-0.024385573,-0.040432006,-0.058161587,-0.011945019,0.01735297,-0.01419831,-0.021106562,0.011852531,0.011539549,-0.2038444,0.026357459,0.014202996,-0.009432144,-0.060625724,-0.009541239,0.034417525,-0.020269914,-0.017160814,-0.013124919,-0.033217154,-0.028763901,0.00029456094,0.010429989,0.007825269,-0.048204612,0.040677737,-0.06389321,-0.0143875005,0.016939892,-0.00954652,0.004725689,-0.32164338,-0.014555516,0.007388922,0.043920644,-0.013106832,0.0026030538,0.040069927,0.0060653305,0.082964465,-0.008577028,0.012869777,-0.031338986,0.028789906,-0.02989402,0.05751869,-0.0022803294,-0.010352063,-0.019732809,-0.00022638594,-0.0017107397,0.0022964417,0.02307662,0.0091918055,-0.005993011,0.013103576,-0.03561518,0.0495876,0.013883645,0.013098049,0.033466306,0.03406194,-0.015613525,0.047476266,-0.027436258,-0.02829423,0.020736236,0.044667076,0.010875213,0.0052066366,0.022825828,-0.013619559,0.0040071765,0.01630811,0.04845834,0.030076552,-0.038075443,-0.015792022,1.9654897e-05,-0.043897133,0.0071329,0.07555882,-0.01492352,0.0038835006,-0.014642728,0.0013992258,-0.00012567153,-0.036871597,0.04096022,-0.030001266,0.019365398,0.013398977,0.039371,-0.017325064,0.011537797,0.0051147025,0.033627555,-0.017991392,-0.04433953,-0.023571204,-0.028863413,-0.08521655,0.042545967,-0.016715825,-0.0109746,0.0396572,-0.036181606,0.026531065,-0.005098141,0.015148332,-0.046532948,0.016291237,0.04183944,-0.02909983,0.016677588,-0.044768568,0.0265322,0.010655736,0.0014365984,0.008797443,-0.034682665,-0.033836704,0.0016739949,-0.0076940106,0.0440649,-0.06772461,0.014228469,-0.016203081,0.010118801,-0.011702431,0.013193407,-0.004923692,0.055941217,-0.005479796,0.027205145,0.043593135,-0.036085546,0.045879476,-0.038431372,0.021543875,0.061180692,0.0005864052,-0.007957209,0.03349396,0.0144266905,0.0104606645,-0.015531077,-0.011734851,0.02126316,-0.0181773,-0.032289423,0.028349753,-0.01145981,0.008889987,-0.03161066,0.0023153732,-0.008260474,0.019804072,0.05670691,-0.042837247,-0.006004392,0.010429238,0.0009243854,0.021425221,0.025840702,0.027923891,0.006810555,-0.03667305,0.005589325,0.005706675,0.0018029952,0.014525832,0.019339824,0.0055773356,0.014049474,-0.05270901,0.041463695,0.036125354,0.016912421,-0.0013148707,-0.006674413,-0.04647604,-0.035204135,0.012653503,0.017363034,-0.013729739,-0.02642748,-0.020499052,0.009138785,-0.0055478103,0.08223207,0.042717773,-0.045415603,0.04507486,0.0046847165,-0.0015277921,-0.0044930987,-0.29322818,0.0065008965,0.0054453155,-0.0041238875,0.007408015,-0.015554688,-0.010049342,-0.019883716,0.006995597,-0.0038531816,0.04694496,0.0023798677,-0.07515328,0.012343829,-0.013219723,0.019087702,-0.010126951,0.015076921,-0.0496199,-0.016738698,-0.008911866,-0.03638266,-0.0034129377,-0.018360516,0.02329368,-0.029144224,-0.004688618,0.030381098,0.0028829542,-0.0106884455,-0.047077753,0.031901326,-0.043519855,0.021557152,0.019160787,-0.049191482,0.08301966,-0.029403072,0.015794737,-0.015568969,0.006184684,0.08857254,-0.016545681,-0.009180054,0.00292776,0.029330896,-0.0026549776,-0.12180155,0.023785086,0.023445917,-0.035771165,-0.004716298,-0.0116741145,0.019785004,-0.0008196388,0.013299712,-0.019438367,-0.030023584,-0.01585524,-0.0076434393,0.031755872,-0.01762912,0.016276954,-0.0421653,0.022641571,0.03244073,0.0147166345,0.17234659,-0.018974911,-0.026750263,-0.009454331,0.025632596,0.015097121,-0.018689975,0.018089034,0.02503223,-0.00575449,0.0024164338,-0.006430511,0.023467952,-0.008001761,0.012807921,0.04912899,0.012476777,-0.029151846,0.0649665,0.025847858,0.00352618,0.029631913,-0.010829887,0.01224072,-0.010669733,0.0033154937,0.011145583,-0.02375636,0.018725628,0.014412343,-0.011177243,0.014238648,0.04626416,-0.053864304,0.025388125,0.021882495,0.015812786,-0.0044457354,-0.01803979,0.02933264,-0.0016272041,0.038157277,0.0030745405,-0.05420757,-0.000690642,0.037655964,-0.004479147,0.023153167,0.040744346,-0.01117651,0.004161274,-0.04234603,-0.049174078,0.019598853,-0.036180407,-0.026680129,-0.00022126174,-0.06010292,0.0064190147,0.02015059,-0.01549164,-0.015960604,0.082729675,-0.02491212,-0.008706573,0.04714635,-0.024902448,0.010301726,-0.035988178,0.028676849,0.011612479,-0.018806817,-0.0054536574,-0.026010435,-0.013151087,-0.047616325,0.008059878,0.007867137,-0.011123931,-0.04636867,0.055137366,0.001990252,0.0147285955,-0.01776897,0.0037442998,-0.046053164,-0.021049052,0.017062217,-0.012327798,-0.019198677,0.04507558,0.026401885,-0.025808375,0.026486391,0.017525397,-0.0017226607,-0.016019369,0.016506983,-0.03955825,-0.0024861433,0.023712216,0.038738336,0.001782408,-0.012401649,-0.020504357,0.017605202,-0.00014285049,0.014877969,0.042071816,-0.038916722,0.04908127,0.005439454,0.005460494,0.039342083,0.0218718,-0.016607597,-0.015295134,0.06055886,0.059842322,-0.033571016,0.021624759,-0.036994588,0.05260606,-0.02159125,-0.01783595,-0.021503348,0.050566386,-0.003206828,-0.039514277,0.013874497,0.023287792,0.015693594,0.011995536,-0.020542605,0.0011122458,0.027484782,-0.027847722,-0.09146437,0.043602787,-0.045738842,-0.007224389,-0.009201257,0.04158205,0.021701701,0.020439737,0.00947709,0.0010291118,0.022048505,0.053015396,0.05381644,-0.036691733,0.020172399,-0.015767496,-0.010580211,-0.016819391,-0.038556535,-0.014046749,0.010194601,0.09797299,0.00737892,-0.0121081,-0.034033783,-0.0023730285,-0.034229156,-0.0033402217,0.007472923,0.03113195,0.002322901,0.019000374,0.0023594324,0.025601905,-0.0052052066,-0.0144838495,-0.025692139,0.02733415,0.02653619,0.03027552,-0.02849268,-0.00738018,-0.009470737,0.02838683,-0.009153837,-0.018309943,-0.03654739,-0.0061635547,-0.004570344,-0.0141169075,-0.0286762,-0.01956529,-0.035558224,-0.030277785,0.017705902,0.022783138,-0.004696898]	2026-09-08 09:32:54.310023+00
19	news	2	0	Kimyo laboratoriyasi yangi jihozlar bilan ta'minlandi	Yangilik: Kimyo laboratoriyasi yangi jihozlar bilan ta'minlandi (2026-08-19)\n\nMaktabimizning kimyo laboratoriyasi zamonaviy jihozlar bilan to'liq yangilandi. Yangi jihozlar orasida raqamli mikroskoplar, elektron tarozilar va xavfsizlik shkaflari bor. Bu o'quvchilarga amaliy mashg'ulotlarni yanada sifatli o'tkazish imkonini beradi.	/news/kimyo-laboratoriya	1f0752f842a08dad4be4aaf19954f8401684c1a58df4aa3c1dfb74bf7093bc2f	[0.00021477534,0.0019560675,0.008223084,0.015745865,-0.024253769,-0.03149222,0.02700448,-0.0060682176,0.012046012,-0.08953528,-0.007843054,0.030705491,0.0015419007,0.004701716,-0.02483597,0.005688618,-0.052335218,-0.02960889,-0.009881617,-0.024701502,-0.027633129,0.03160457,0.02153543,0.0029759111,0.0057660406,-0.022464557,-0.007182212,-0.019081783,-0.022254108,0.23323914,0.02343236,-0.029377721,0.0011211254,-0.023262614,0.017228207,-0.006663225,0.0051750788,-0.011508382,-0.018223485,0.01721868,-0.02310782,-0.015667625,-0.004504485,-0.021773351,-0.06435732,0.013044689,0.014832094,0.008452355,-0.008883502,-0.0026778618,0.044877667,-0.029828662,0.03812935,0.024620513,-0.0025418478,0.0069892737,-0.027033353,-0.004257106,0.008021749,0.020602932,0.04261489,0.019581111,0.019951293,0.0059839417,0.020647492,-0.0019636606,0.037219387,0.0003617844,0.020044085,0.005329128,0.010186922,-0.0136892665,0.022293933,0.02092352,-0.011602023,-0.018922254,-0.02539179,0.014173859,0.01620131,0.02248318,-0.009764507,0.020567223,-0.024812765,-0.014997363,0.046462357,0.03457316,0.03450345,-0.0022207513,-0.03762804,0.025189577,-0.015894512,0.029255161,-0.004667907,-0.047655877,0.002622964,-0.004574747,0.023189463,0.030903812,0.024147436,0.0150458515,-0.0045128977,-0.0021670482,-0.0037629905,-0.020839231,0.023825718,-0.053263526,-0.0022033663,0.03419266,0.019058323,0.02560996,-0.011799181,-0.2894171,0.046395987,0.011028266,-0.015986588,-0.053434644,0.0020777176,0.017240992,0.07872315,0.050993506,0.03715724,0.0051496346,-0.0020093143,-0.007862491,-0.0048557436,0.010161567,-0.0051306286,0.00837382,-0.04198501,0.014624999,-0.015452075,0.051537886,0.028010488,-0.019359838,0.0024028535,0.008743922,-0.014725209,-0.023406236,0.0027674004,-0.052233428,-0.013982675,-0.022409324,0.008106898,0.00921291,0.0072215935,0.021038054,0.029289622,0.05212033,0.0631348,0.0381363,-0.020584825,-0.0056056827,0.016687294,0.029969828,0.009622374,-0.029778926,-0.03396192,0.044538133,0.012847458,0.049610037,-0.039059483,0.0058635976,0.0018194411,0.02596963,-0.051662076,0.023075333,0.023876088,0.009720956,-0.015971372,-0.014300681,-0.02136368,0.037789244,-0.001587174,-0.019736622,0.0033363437,0.004979035,0.014854149,0.010516535,0.011558036,0.0035518094,0.041654073,-0.013124691,-0.049352847,-0.00297367,-0.010898959,-0.011315362,-0.019324657,-0.019566506,0.010031563,0.011597237,0.024195768,0.0375645,0.024990885,0.012045546,0.0457951,-0.011913571,0.028417476,-0.026169589,0.0070761708,-0.0042113205,-0.015367053,-0.011249423,0.031696588,-0.026403068,0.011179854,-0.04891997,0.0006540366,-0.018553996,0.009638773,-0.04822852,0.0026999614,-0.043033183,-0.03511889,-0.061051063,0.0040286807,-0.03914666,0.04253684,0.036219314,0.020381229,-0.01744444,-0.0011701575,0.01029201,0.015487132,-0.005436263,0.01203759,-0.057157595,0.0138966255,-0.029169042,0.004164823,-0.03421058,0.0061903214,-0.03007568,0.033936527,-0.023891456,-0.00553806,-0.013975459,0.02107084,0.00012364735,0.025218012,0.003972727,-0.021594035,-0.0075203073,-0.03501821,-0.02174117,0.025594955,0.006004207,0.019215167,0.04305957,-0.016640838,-0.03575929,-0.048436567,-0.01322578,-0.009484556,-0.028171,0.00028038924,0.03509395,0.022060663,-0.0071539013,-0.030809475,-0.06310408,0.03941184,-0.03378388,-0.037143666,-0.008268568,0.027789282,0.046831023,-0.032673456,-0.07721727,0.024429016,-0.030957092,0.009161827,0.03409378,0.021264216,0.011574941,0.042348746,0.046629786,0.023618104,-0.025782255,-0.018402765,-0.008231182,-0.015137019,-0.03907561,0.0038066232,0.009009769,0.033762626,0.030022053,0.019054739,0.025273094,0.019538835,0.00920651,0.025302181,0.023451868,0.03700642,0.016962899,0.0055227047,0.022943988,0.020553421,-0.0296571,-0.033612948,-0.0008213213,-0.022129316,0.03371941,0.031948432,0.0080744345,0.026911195,-0.021358786,0.01473301,0.005806304,-0.027090147,0.036275487,-0.006506562,-0.0068447315,-0.0403898,-0.014612972,0.011017526,-0.02617364,-0.040966123,-0.0006678435,0.003774708,-0.19910564,0.023183158,0.0021274635,0.0016171765,-0.029658008,0.0114838695,0.026495066,-0.04904186,-0.051572613,-0.009853244,-0.04592088,-0.024600076,0.0024602055,0.02246562,0.035514083,-0.014298812,-0.009772755,-0.062869504,0.031482995,0.0007179999,-0.024271566,-0.0063199927,-0.32355407,-0.0034848484,0.010448773,0.03920284,-0.010859097,-0.020510035,0.03921171,0.0157232,0.080750555,-0.025158854,0.03221522,0.0019426384,0.0015809129,-0.031346396,0.051742032,-0.007408423,-0.01302997,-0.0099573685,0.016241783,0.0002443028,0.011168661,0.025150813,-0.0050799055,-0.008367935,0.010614336,8.278501e-06,0.077293076,0.016647317,-0.004867148,0.04075903,0.059853017,0.026874086,0.028562257,-0.0071189567,0.013655695,0.026524954,-0.015725981,-0.03581773,-0.008094005,0.004828761,4.4393208e-05,0.014504355,0.0024705655,0.06320637,0.016062781,-0.06463843,0.017691724,0.02994676,-0.04183808,-0.016235072,0.056967564,-2.3339888e-05,-0.0069970204,-0.0015633533,-0.049411044,-0.024248548,-0.03476713,0.042425234,-0.040329132,-0.0059539606,-0.0012571759,0.050544083,-0.022736583,-0.0043482073,0.026400622,0.018738644,-0.009193643,-0.03288401,-0.063470855,-0.050620038,-0.066677414,0.028465893,-0.04007822,-0.013004389,0.0077442434,-0.038652387,0.0149135105,0.0012856779,-0.03364096,-0.06371771,0.02223658,0.005275033,-0.043708812,-0.0045483327,-0.050323386,0.015733413,0.01646106,0.0026819082,0.003830581,-0.033427168,-0.042510394,-0.018406035,-0.01965371,0.05061089,-0.044897657,0.03696181,-0.039513353,0.02491248,-0.0039691827,-0.023493376,0.018748762,0.018358083,-0.031936605,0.053498097,0.024202567,-0.041799296,0.021981558,-0.037958257,-0.009541585,0.042910576,-0.008988227,0.0019900785,-0.025829269,-0.0063852817,-0.01079403,0.0013923387,-0.02035749,0.0059666038,-0.020879462,-0.015001359,0.039889857,-0.0052024485,-0.013150241,-0.010891819,0.00725431,-0.009470954,0.034117393,0.014506724,-0.029856894,-0.044215962,-0.03365174,0.02028484,0.02793631,0.020295823,-0.008825939,0.0014118991,0.0030089736,0.004598498,0.0116745755,0.023486044,0.023588605,-0.017433193,0.033662688,0.03106973,-0.03442776,0.022336692,0.007900494,0.05407587,0.0043491563,-0.023949921,-0.021497916,-0.07995638,0.016976923,-0.004981189,-0.0028382265,-0.014404932,0.02046905,0.0089503145,-0.015217759,0.09102236,0.014583557,0.008076761,0.046801634,0.009374501,0.006644133,-0.011054354,-0.28151447,0.007890802,0.0102842925,-0.022069044,0.010788786,-0.019304771,-0.02103105,-0.024018405,0.020885972,0.00635417,0.053521685,0.004766917,-0.02906715,-0.00042419796,-0.010274149,0.007402753,0.024152946,-0.0017151716,-0.04237266,0.0037957956,-0.025648592,-0.030991247,-0.015943402,0.00036885263,0.019717844,-0.041915793,-0.007352641,0.036509477,-0.043157108,0.0134768365,-0.05867971,0.04090801,-0.0105166435,0.029283494,0.01504266,-0.006481471,0.07013333,-0.03976726,-0.011976968,0.008403138,-0.01810538,0.03875081,-0.029406348,-0.014823396,0.022346506,0.028476037,0.016899781,-0.12163099,-0.010263407,0.003919049,-0.0224415,-0.014358792,-0.008634965,0.001623739,-0.011831035,0.043156937,-0.005371427,-0.050570272,0.0058476077,-0.024164593,0.04189801,-0.007685135,0.0012378905,-0.015118209,0.04788905,-0.0034684965,-0.014078245,0.15636525,-0.0068159965,-0.03580556,0.0008919564,0.07064872,-0.0025707327,-0.018954841,-0.008257717,0.019031607,-0.01122997,0.0254572,-0.02382216,0.015236518,-0.015268552,0.00772525,0.009575166,0.011567561,-0.043623686,0.04942408,0.035480537,0.009376189,0.034852378,0.0049248906,-0.00042032945,-0.0058160387,-0.0062610367,0.037841044,-0.013942727,0.052008282,0.031547558,-0.034837812,-0.012796831,0.010250527,-0.049383316,0.053330936,0.039479632,0.048766818,0.014053032,0.009389169,0.024195537,0.028586378,0.04655636,0.010575315,-0.061236143,-0.026020568,0.018880054,-0.02367313,0.04580847,0.022873433,0.009207224,0.009835279,-0.04230878,-0.03917873,0.012970634,-0.014269098,-0.04465168,0.008087904,-0.054470558,-0.015996516,0.015749829,0.02092599,-0.05310621,0.07765129,-0.008080614,0.0038961633,0.061655283,0.015312829,0.010720311,-0.04058225,0.04200291,0.016630393,-0.015750874,-0.021874588,-0.00915454,-0.015324632,-0.01119741,0.022647368,-0.006496622,-0.0011403104,-0.02584321,0.028371783,0.03828046,-0.009597917,-0.037352394,-0.005084329,-0.014952948,-0.0332177,0.03219777,0.00043175093,0.004345635,0.03662999,-0.0016004943,-0.024525402,0.02208605,-0.0019205608,-0.003880175,0.023771672,0.018934984,-0.054838207,-0.0050166626,0.0068045137,0.007668356,0.0036822737,-0.03970561,-0.014707496,-0.012134843,-0.013550482,-0.024419043,0.03535706,-0.030639082,0.044020474,0.0050081625,-0.025979763,0.0037855178,0.017230315,0.0029604083,-0.02711839,0.048899062,0.029450431,-0.045736946,0.039985444,-0.019785793,0.02415711,-0.003729438,-0.014360303,-0.023244869,0.049977582,0.0027316413,-0.038214818,0.018826611,0.021360356,0.061313096,-0.012611425,-0.020338753,0.023873018,0.005362261,-0.00040687894,-0.09739593,0.025644617,-0.02919973,-0.009079816,-0.01172882,0.04910802,0.01612272,0.021282848,0.021276666,-0.0050957315,0.010148897,0.0015256187,0.05451207,-0.0020985566,0.0043175314,-0.031739138,0.01571676,-0.02218218,-0.022964314,-0.0081448415,0.000976056,0.09100636,-0.013426728,0.022280013,-0.0017317672,-0.014490274,-0.040921606,-0.014899789,0.0010570352,0.0031942585,-0.006214635,0.026804646,0.012390183,0.028036384,0.014070236,0.0035995694,-0.03790327,0.019150719,0.042063482,0.036749862,-0.020945836,-0.016517753,0.0042657442,0.026367182,-0.02866833,-0.012763651,-0.06619414,0.02529532,-0.010547877,-0.033025727,-0.059372686,-0.02210693,-0.018180665,-0.02550136,0.014093968,0.029282423,0.006112524]	2026-09-08 09:32:54.310023+00
20	documents	1	0	Maktab ichki tartib qoidalari	Hujjat (Nizomlar): Maktab ichki tartib qoidalari\n\nO'quvchilar va xodimlar uchun ichki tartib qoidalari to'plami\nBu hujjatni maktab saytining hujjatlar bo'limidan yuklab olish mumkin.	/documents	de7c73a950ab8a014fee928ee4f50d789066b9e5c0460ad897f0e2edcd90b38f	[-0.00653672,0.0091039,0.072062515,0.03433501,-0.0073904665,-0.009838064,0.022070127,-0.00063916255,0.024327235,-0.05732984,-0.02359602,0.011324704,-0.013628221,-0.012953885,-0.02280874,-0.016949363,-0.006707364,0.009296145,0.020176765,-0.04042273,-0.015761556,0.009498962,0.015623545,-0.0016270366,-0.01720799,-0.074592926,0.017436244,0.0084835095,-0.038682118,0.26223713,0.0067580026,-0.012892527,-0.016056862,-0.03452754,0.033980325,0.001226639,-0.017091751,-0.034647197,0.0107659325,0.00967681,-0.009330947,-0.014827315,-0.04127799,-0.0030603788,-0.052980077,-0.007922867,-0.013496161,0.02195854,0.006075469,-0.024069712,0.022015689,-0.022836585,0.021673447,0.010722032,-0.009432858,0.011233618,-0.013292411,-0.012900024,0.019815117,-0.021545129,0.030491035,0.011195929,0.025228286,-0.024112916,0.0027939626,-0.003882373,0.011498812,-0.012142694,-0.0034562678,0.015916599,0.027177371,0.023669219,0.026881576,0.014704238,-0.024026714,0.032800034,0.011459777,0.015103403,0.020334648,0.060721833,0.011357482,0.026195114,-0.021741996,-0.033207737,0.0024079555,-0.022577692,0.02163709,0.035590407,-0.0013673544,0.043191113,0.015159437,-0.007232596,-0.00896768,-0.019952396,0.015876519,0.012242743,0.00077358517,0.020930348,0.011983957,0.040480368,-0.02006931,-0.0001304668,0.025828682,-0.016789308,0.021820026,-0.056347337,0.006527546,-0.0023189634,0.06125462,0.0039713676,0.015350483,-0.27821597,0.028120646,0.0091598695,-0.05123481,-0.06666139,-0.0071600443,0.02260259,0.056910567,0.031597137,-0.0127121005,0.0010851016,0.0055969446,-0.037641153,0.0050709853,0.0029591583,0.023094144,0.030413756,-0.0056562577,0.056186147,-0.006426305,0.041940708,0.03802944,-0.027534286,0.01429134,0.024270158,-0.044772275,-0.008371587,-0.023762535,-0.023192486,-0.01283416,-0.022784078,0.014493072,0.006526347,-0.026401773,0.010189747,-0.016240878,-0.0050934837,0.0707529,0.023745216,-0.008405522,0.002091359,-0.027779272,0.020319689,-0.015827699,-0.020141495,0.022869209,0.027065411,0.022069449,0.071237035,-0.044105776,-0.027100574,-0.012949779,-0.008328144,-0.03170922,-0.007248649,-0.009186113,0.0385206,-0.052741867,-0.01004488,-0.010282135,0.042492945,-0.04956035,-0.006742534,0.032709613,0.011042725,0.028566957,0.035420448,0.0015667477,0.011881903,-0.0017089066,-0.023394829,-0.058869287,-0.0061158217,-0.020755824,-0.029642735,0.023522869,0.0058484096,0.034401,0.02205939,0.02074815,0.023266079,0.012314483,0.014439403,0.03203378,-0.024612824,0.014793362,-0.038690727,0.007659121,-0.00764453,-0.0025656268,0.001342634,0.06278924,-0.024191864,0.028384542,-0.0017871467,-0.020151882,0.01670701,-0.014998458,-0.05004987,0.012941246,-0.045134336,-0.003631813,-0.011561925,0.0383632,0.014792666,0.004585235,0.03427187,-0.020850189,0.0011148882,-0.005261392,-0.046186797,0.028436134,-0.01653885,-0.013626787,-0.036383405,0.030281639,-0.0020730728,0.034397505,-0.02761896,-0.02582361,-0.030787984,0.023266615,0.028238144,-0.041674003,-0.018851588,0.042142007,0.021674683,0.024248872,-0.05030204,-0.01632276,-0.008979031,-0.016794143,-0.0047885873,0.038729403,-0.02089604,-0.0066323397,0.027186062,-0.033208255,-0.038005434,-0.05455797,-0.010219805,-0.0096307965,-0.021387924,0.019546319,0.008714365,-0.005487987,0.010550779,0.00087221497,-0.017943908,-0.0036005732,0.036314927,-0.018620769,-0.014061009,0.04338256,-0.010110279,-0.013571341,-0.03588345,0.06723244,0.020154579,-0.025607359,0.0570875,0.013166443,-0.037970927,-0.013980705,0.072454214,0.026984923,0.013079648,-0.026530119,-0.02239406,1.0582985e-05,-0.034672897,-0.021582719,0.036487456,-0.0021970726,0.022981992,-0.027998976,0.041866433,0.018051587,-0.0012916515,0.053223748,0.026040778,-0.0050713546,-0.024559872,-0.008320972,0.018991547,0.0009776786,-0.014202888,-0.046847254,-0.005622937,-0.025216639,0.0024331163,0.029203419,-0.007012741,-0.012608356,0.039271597,-0.012427279,0.03494803,0.004355137,-0.018717667,-0.03109262,-0.04193844,-0.041101996,-0.011873148,-0.0034806957,-0.012347989,0.0023277665,0.017709196,-0.007790094,-0.21304049,0.021295574,-0.0064521465,0.037286345,-0.031114632,-0.000883282,0.0113524245,-0.05989711,-0.037060596,0.010509597,-0.031894278,-0.011014117,0.03126611,0.01688698,0.026728543,-0.014023566,-0.0008747158,-0.045590553,0.0018687714,-0.009365868,-0.002406712,0.015116514,-0.34225574,-0.0067868275,0.04102622,0.02047067,-0.012939526,-0.018329684,0.018625034,0.011454698,0.009859655,0.018267138,-0.011445263,-0.002392994,-0.0002683501,-0.0008230263,0.044411596,-0.021451525,0.007467579,-0.008375555,0.006444003,-0.019015104,-0.0033782518,0.008812048,-0.0075112586,0.012076444,0.010594979,-0.0444612,0.074326426,0.010321598,0.01750145,0.06366212,0.024444643,0.012447784,0.015139968,-0.018934509,-0.026480513,-0.0015741264,-0.012137808,0.0022475068,-0.053319003,0.018763214,-0.005009656,-0.03732305,0.0030008103,0.05470491,0.023251422,-0.03341791,-0.0017331046,0.024798155,-0.067111574,0.028878309,0.06303666,-0.04105977,0.014784143,0.005547731,-0.020377014,-0.020791091,-0.013997534,0.027936457,-0.0074289837,0.01296719,0.022884589,0.02225744,-0.010217761,-0.014817667,0.007813429,0.032879777,0.014939669,-0.035013106,-0.027384408,-0.012549612,-0.036480047,0.018644324,-0.06214438,0.02324736,0.016557552,-0.05222976,0.06315087,0.046500914,-0.02959623,-0.017021459,0.007320996,0.024425255,-0.009111806,0.02686037,-0.05984195,-0.0039984356,-0.03240689,0.00059245573,0.028294489,-0.0064772973,-0.030473342,-0.0002933963,-0.028903238,0.035827037,-0.0171766,0.0031415795,-0.021392345,0.039245866,0.011826566,-0.023829883,0.04309094,0.019021109,-0.020454736,0.0018191481,0.032066744,-0.022943242,0.010823053,-0.04416346,0.033105332,0.057008382,0.016962273,0.01662271,-0.020693969,0.0035559463,-0.007724706,-0.015559296,-0.04664969,-0.052313954,-0.0093312515,-0.05667572,0.0003224338,-0.02142409,0.062227603,-0.00090820907,-0.013010944,-0.013854921,-0.019909112,0.031499725,-0.0637955,-0.012537428,-0.01802294,0.005420874,0.03372502,-0.01119631,0.050248858,0.004141544,-0.018212313,-0.0073528537,-0.014786363,0.046348568,-0.026007429,0.002223417,0.0029178767,-0.0018256626,-0.05766841,-0.00836486,0.029212512,0.045520198,0.02303809,-0.0032847433,-0.036132198,-0.039077472,-0.016415413,0.008495565,0.008855159,-0.0067555686,0.0029352969,0.024262112,-0.052052327,0.015891481,0.030037468,-0.049820017,0.018310752,-0.012937412,0.0014181972,0.025290973,-0.28153872,0.026715416,0.021368757,0.0022733656,0.0102235265,-0.012783384,-0.006401829,-0.030073224,0.018610582,-0.019957596,0.021691374,0.00868819,-0.06513186,-0.0104838805,0.0015452886,-0.010054715,-0.030286226,0.011144843,-0.019635309,-0.0043376833,-0.0017403029,-0.055535734,-0.00838355,-0.050322376,0.030097215,-0.057894982,0.0011559582,0.02115183,-0.0043940293,0.018573314,-0.007925907,0.014895203,-0.020632489,-0.016106846,0.0109625645,-0.020420428,0.054897364,-0.037012916,-0.0421958,0.013471679,-0.020538215,0.035103768,-0.0161098,-0.028722504,0.01411166,0.019979428,0.012087096,-0.119164966,0.017009912,-0.023574825,-0.035695247,0.02295539,-0.021914052,0.03953004,-0.0058479127,0.0024448147,-0.025261644,-0.054337148,-0.023102036,-0.039513618,0.025216915,-0.013943392,-0.013122207,0.013175005,0.04824946,0.04966002,0.035345584,0.14435448,-0.035857096,0.0115080355,-0.0073168287,0.01691572,-0.0027004334,-0.00051454327,0.015004707,0.01793298,-0.0029186893,0.009419147,0.0006440701,0.035462655,0.005657627,-0.0022580493,0.042377133,0.020610819,-0.0036425279,0.06475047,0.008802029,0.018775932,-0.025157565,0.02091243,-0.0059324666,-0.00086148275,0.034495786,0.023554789,-0.016823314,0.030048572,-0.031322695,-0.011705489,-0.0015204439,0.02313868,-0.064266324,0.030488893,-0.003206722,-0.0012411671,-0.015256372,-0.029000536,0.0044354317,-0.0047869277,0.029913655,0.015685176,-0.016291976,-0.024539255,0.029600237,-0.048834752,0.021416929,-0.018499643,0.0026584582,0.0083728125,-0.03559474,-0.033999637,-0.014111321,-0.024009904,0.008879608,-0.025600707,-0.039633915,-0.010246001,0.011017599,-0.033944912,0.008420143,0.0669024,-0.014333705,-0.0054282905,0.023810504,-0.01811364,-0.0005497908,-0.025403932,0.032449022,-0.0030455892,-0.00041758548,-0.050241545,-5.0547693e-05,-0.007902231,-0.009428572,-0.01261877,0.0071007125,-0.014394359,-0.039925486,0.047958773,0.01446627,0.0072846925,-0.006739306,-0.015897179,-0.029769395,0.0104648145,0.031268004,-0.026403422,0.04721933,0.019376185,-0.02520942,-0.016694004,0.051966637,-0.013310641,0.029813828,-0.031098815,0.014711961,-0.038344957,0.007603842,0.012132249,0.012345551,-0.0037743722,-0.020153632,-0.011457881,-0.0060045617,-0.0068449667,0.0104962895,0.023643205,-0.026590968,0.036083926,0.0094438065,-0.024545403,-0.047258493,-0.04004959,-0.0027580522,-0.044008177,0.07536191,0.06262772,-0.0055125295,0.039632086,-0.040446837,0.02618697,-0.014338705,-0.019661665,-0.054106377,0.040754993,0.012810409,-0.047405727,0.026766278,0.020105705,0.03391787,-0.045137655,-0.021655716,-0.008570192,-0.024376485,-0.014813296,-0.07210277,0.042023093,-0.00049188617,-0.020075949,-0.068877615,0.007829564,-0.0036230076,0.014143369,-0.00057369826,-0.030683855,-0.0040205666,-0.03303259,0.032445617,0.017234698,0.007686759,-0.028901426,0.013474123,-0.0033498118,0.016282765,-0.023689602,0.016473154,0.09129838,0.0005838314,-0.0007263078,-0.071373835,0.029028296,-0.042906024,-0.006012233,0.019097677,0.033853076,-0.01212026,0.011917246,0.011955813,0.0034425033,0.023046903,-0.020138862,-0.053666856,0.026998669,0.013466218,0.009390958,-0.003694471,-0.053177387,0.015704684,0.05371624,-0.00040978083,0.031765558,-0.01371123,-0.00680883,-0.029179148,-0.0059563937,-0.014577541,-0.015861973,-0.01807913,-0.013067495,-0.004118049,0.005926734,-0.00881195]	2026-09-08 09:32:54.310023+00
21	documents	2	0	2026-2027 o'quv yili ish rejasi	Hujjat (Rejalar): 2026-2027 o'quv yili ish rejasi\n\nMaktabning yillik o'quv-tarbiya ishlari rejasi\nBu hujjatni maktab saytining hujjatlar bo'limidan yuklab olish mumkin.	/documents	4e3cf14c719917e4c916f940da83e95efe430490d6e0b63c751c59d717d71b44	[-0.0066017313,-0.0046749986,0.03896676,0.025090104,-0.006583562,-0.004935229,-0.0018986778,0.021210166,-0.006764752,-0.055213083,-0.013331278,-0.021407632,-0.025913715,-0.0049592955,-0.030296538,-0.0036929431,-0.013286612,-0.014635871,0.008682142,-0.02817083,0.0011552771,-0.010874145,0.015368882,0.010293122,-0.02573513,-0.09426034,0.005015847,-0.0005816502,-0.028497877,0.22994292,0.0388795,-0.037065204,-0.0033587571,-0.019679952,0.037763193,0.0047321487,-0.022213006,-0.025195217,-0.012140116,0.022905692,0.0258108,0.00066620595,-0.031293266,0.0062205344,-0.047540292,-0.01399704,-0.010748352,0.023485607,-0.0053882743,-0.019161962,-0.011510596,-0.04543667,0.03352772,0.01543962,-0.023074137,0.027865112,0.015289615,-0.024334027,0.0276395,0.0001603441,-0.0056404555,0.01817657,0.011282836,0.025644442,0.019712852,-0.009030955,0.0017813427,-0.011150669,-0.0077859717,0.039052516,0.010705293,0.0391419,0.023556776,-0.012181464,-0.01710538,0.021144206,0.00867438,0.017913662,-0.017005254,0.021670029,-0.00038248024,0.03712567,-0.029308977,0.017634468,0.023531696,0.005185271,-0.017934969,0.021266878,-0.03276907,0.03223219,-0.0024212394,0.010530325,-0.025368229,0.004778886,0.021068476,0.010214387,-0.009513226,0.010677499,0.014400909,0.022168543,-0.020120628,0.0027827749,0.013977847,-0.018717092,0.020051273,-0.06344368,0.014845804,0.0059741708,0.029569153,-0.008686133,0.04582084,-0.28660947,0.008928584,0.022280606,-0.07493636,-0.07653824,0.0026780944,0.015905349,0.10444094,0.0031240394,0.03441046,0.0140351895,0.005339082,-0.053655263,0.0039649014,0.01526934,0.040877555,0.012794302,-0.0079809325,0.035702575,0.010540788,0.023110244,0.016391264,-0.041997656,-0.019003114,0.029869296,-0.04850417,-0.020356858,-0.0063505736,-0.022796376,-0.024191141,-0.027755097,0.021202324,0.011267678,0.035815403,-0.0012662712,-0.003051713,-0.014855485,0.047685992,0.0079770405,-0.018033333,0.018635618,-0.03954055,0.034817412,-0.0053584,-0.031139316,-0.0073930062,0.03760887,-0.0008636377,0.037482325,0.0027049151,-0.028106662,-0.010161909,0.020880645,-0.025732582,-0.004589919,-0.0064506833,0.019380666,-0.032742336,-0.011914537,-0.04435663,0.03434348,-0.040660784,-0.0087123895,0.005402827,0.021469982,0.01760128,0.00695876,0.034400985,0.034616306,0.004535506,-0.02150082,-0.035310846,-0.019497631,-0.016365118,-0.0034648995,0.019904092,-0.00045036056,0.001581736,0.0092699025,0.024173018,0.03350646,-0.0133044105,0.016711727,0.053587515,-0.007992837,0.030113345,-0.0036142222,0.00035194587,-0.008392539,0.008008669,0.0018620844,0.05672867,-0.012886991,0.020155778,0.004723664,-0.01398532,0.013482161,0.0074448036,-0.032975562,0.03667927,-0.014225536,-0.024148906,-0.039517745,-0.022988366,-0.020135157,-0.008114223,0.021467706,-0.014447166,0.018000003,0.021792565,-0.019558715,0.022714732,-0.044804994,0.016524957,-0.01081591,0.033567745,-0.00029676838,0.027351184,-0.02505986,-0.030628283,0.026541831,0.015488297,0.0009531175,-0.012834382,-0.0500874,0.049026553,0.057893436,-0.0001923766,-0.026917012,-0.010562599,-0.027075903,-0.026127685,-0.03282018,0.013931065,-0.03448745,0.0021803891,0.019944398,-0.052214187,-0.025511188,-0.043571,-0.024559554,-0.0015121913,-0.006569841,0.018293712,0.021381281,0.005107301,-0.0048971293,-0.0026664147,-0.016782276,-0.008906952,0.029682698,-0.00041006517,0.004830913,0.03924509,0.0066355853,-0.024568008,-0.068641074,0.058839943,0.011993785,0.004737401,0.036201525,0.008684925,0.007913472,0.019407362,0.033373933,0.027152348,0.0001636204,0.0038425548,-0.035681788,-0.017220462,-0.031777974,0.015474271,-0.007321152,0.003974545,0.032614604,-0.039231982,0.0020320774,0.013609264,0.016798824,0.06033869,0.023299864,0.006615891,-0.00080538145,-0.021353485,0.0048203063,0.018074261,-0.013578055,-0.02631804,-0.0048371986,-0.04554392,-0.0047154417,-0.005794897,-0.01654352,0.00088427035,0.02801268,0.007366116,-0.0028084419,0.005384795,-0.018249568,-0.024754776,-0.022863114,-0.03479518,-0.025213134,-0.008011433,-0.01812737,-0.022659998,0.02346942,0.017116958,-0.19314119,0.02216612,0.004322332,0.040765595,-0.019182477,-0.010874654,0.013410387,-0.079481795,-0.031239383,0.013278417,-0.031676754,-0.038023915,0.020885123,-0.015951075,-0.0067995433,-0.008142325,0.0015689152,-0.051571112,-0.0048776367,0.0294157,-0.00811279,-0.006370324,-0.33458984,-0.018457511,0.025980946,0.01369426,-0.0060121156,0.0128223905,0.03165844,-0.0010464761,0.021547863,0.005667013,-0.00632358,-0.027966784,-0.03432957,-0.022049356,0.05003765,-0.034008227,-0.0088531915,-0.0010117289,-0.0126301125,-0.0061471052,-0.013421662,0.01525166,-0.055310354,0.0083158575,-0.0091312975,-0.023538264,0.089795366,0.010450828,0.012766176,0.052258056,0.042566538,0.029825598,0.03476115,-0.0023972185,-0.031761736,0.014986094,0.0064721946,-0.0108662,-0.035877224,0.031827573,-0.01058025,-0.032608528,0.0126222465,0.06726322,0.024843916,-0.009113669,-0.012136849,0.008052336,-0.044723846,6.533841e-05,0.059218917,-0.055442892,0.013282746,0.006378625,-0.03767715,-0.013272836,-0.029606532,-0.0027515762,-0.03062487,0.017223401,0.012608499,0.02228363,-0.018760229,-0.012146116,0.011705828,0.031018253,0.004866105,-0.06222633,-0.023385774,-0.017434396,-0.043550096,0.0046231793,-0.05070417,0.033208787,0.01442517,-0.032898616,0.045400992,0.028043881,-0.0195555,-0.0030179725,0.026659537,0.03777793,-0.017791905,0.027266966,-0.044626854,0.021966327,-0.024838192,0.01416137,0.043335605,-0.045366045,-0.030141307,0.017327046,-0.003139852,0.030530138,-0.053440344,0.010281524,-0.024584126,0.015857203,0.02565201,-0.032339416,0.011831821,0.029596709,-0.043901213,0.04303782,0.022950798,-0.03548581,0.0073299115,-0.051908683,-0.0018525402,0.06369292,0.022155022,-0.008386567,-0.02473623,-0.0030029134,-0.0066702506,-0.018832993,-0.019176079,-0.033561636,-0.019171352,-0.018147608,0.008342957,-0.027120434,0.030674554,-0.01555897,-0.022958597,-0.04606232,-0.044463933,0.033839967,-0.07470517,0.0038679526,-0.005558642,-0.008701003,0.019662607,-0.013933886,0.031981196,-0.001966422,0.007880804,-0.023583988,-0.004844295,0.012128075,-0.022027716,-0.017271234,-0.009877323,-0.0093581425,-0.06015285,-0.03396216,0.025667159,0.07041584,0.018886799,0.006980302,-0.009076936,-0.07322351,0.005059266,0.027098555,0.008017523,0.01939489,0.012387808,0.021527968,-0.017014192,0.021296058,0.032054532,-0.010078356,0.008172955,0.014833845,0.021144273,0.0150198415,-0.28774002,0.021780217,0.057725135,-0.026777994,0.020654172,-0.032622032,-0.021385316,-0.045476917,0.008808409,-0.01735221,0.04002468,0.0052319947,-0.038722664,-0.0077538155,-0.0013035695,-0.00085822254,-0.03117956,0.006191136,-0.05132478,-0.043962754,-0.011511402,-0.046642315,-0.028016984,-0.004097288,-0.024897968,-0.057167247,0.027302166,0.021630488,-0.02879491,0.010614166,-0.038672473,0.018640863,-0.034490205,0.002248603,-0.025550658,-0.022988155,0.031519435,-0.022621721,-0.043506917,-0.0052836714,0.0060532913,0.06031984,-0.04864224,-0.029553449,0.008457615,0.0075209914,0.02441659,-0.13544606,-0.001494528,-0.011474186,-0.01879833,0.0028014963,-0.035672486,0.02766891,-0.0087309815,0.01847503,-0.0243616,-0.048922714,-0.025763715,-0.026619487,0.049631137,-0.009026633,-0.01390737,-0.009516631,0.02702258,0.05294329,0.025165595,0.1703586,-0.038166266,0.01928601,0.020239184,0.0005024242,-0.011484961,-0.012274003,0.0080983555,-0.002023238,0.0064768465,-0.013365201,0.01068271,0.0031376726,-0.003326957,-0.02023778,0.012594702,0.00097367883,-0.010586688,0.076843284,0.023208113,0.029645817,-0.011633797,-0.0042616692,0.019385805,-0.022104396,0.026283167,0.048526745,-0.0106250085,0.049034335,0.0028285682,-0.013088097,0.023627808,0.034687553,-0.08027811,0.032263428,0.016887272,0.014896415,-0.00046947878,-0.011782638,0.008269344,0.008296195,0.00722139,0.015363077,-0.03251871,0.002723314,0.059566673,-0.044853326,0.016598737,0.011056292,0.007667313,0.033225995,-0.022421267,-0.023951516,-0.02610389,-0.025099423,-0.0011335074,-0.016326938,-0.03103389,-0.0045995093,0.029391672,-0.019364027,0.007840679,0.062382035,0.005898817,-0.02793743,0.050158292,-0.021559399,-0.0077606807,-0.036810525,0.009692121,0.011302325,-0.0128928935,-0.032378674,-0.0065467386,-0.020202335,-0.006673816,-0.035173874,-0.011455823,-0.0028642083,-0.065235235,0.039107677,0.02049923,-0.01018169,-0.00798343,-0.015297931,-0.041102808,-0.011911212,0.04529554,-0.040192086,0.036166,0.04395664,-0.016932713,-0.02684002,0.057683975,-0.031461213,0.038043857,-0.0029133458,0.036769744,-0.03486451,0.011303407,0.010021007,0.03094163,-0.009196948,0.005166072,-0.002482297,-0.0011874696,-0.009137438,0.01916994,0.021157688,-0.02768752,0.021069646,0.015692411,-0.018120162,-0.010884094,-0.029324483,-0.03518399,-0.025627892,0.0472274,0.02271675,-0.0067849862,0.029633136,-0.028545944,0.03705759,-0.025350796,0.00997582,-0.051365912,0.053468496,0.029960742,-0.028155524,0.00761995,0.0066301734,0.029519506,-0.0115500195,-0.0037485112,2.3978957e-05,0.0031814976,-0.043074157,-0.030682065,0.02545155,0.002721724,-0.030018441,-0.053305745,0.011930547,0.014503128,-0.010491744,-0.03855262,-0.016753789,-0.01888161,-0.034090534,0.06927328,0.013827744,0.008424674,-0.019505141,-0.011247794,-0.02794142,-0.01576162,-0.0016431175,0.03712707,0.1017717,0.027694939,0.002159566,-0.054959152,0.047087576,-0.02963067,-0.036896586,-0.018028362,0.053328834,-0.034241013,0.0010074606,0.029096425,0.037370954,0.020132296,0.0035263356,-0.015591845,0.022733547,0.014709805,0.006919022,0.009835006,-0.049976166,0.0029654682,0.064186126,0.024421759,0.0028876113,-0.020124083,0.019686777,-0.018206317,-0.010907611,-0.026873617,-0.03020222,-0.046652995,-0.023929847,-0.0024884855,0.03756659,-0.0130932685]	2026-09-08 09:32:54.310023+00
22	documents	3	0	Bepul ovqatlanish tartibi haqida buyruq	Hujjat (Buyruqlar): Bepul ovqatlanish tartibi haqida buyruq\n\nBoshlang'ich sinf o'quvchilarini bepul ovqat bilan ta'minlash tartibi\nBu hujjatni maktab saytining hujjatlar bo'limidan yuklab olish mumkin.	/documents	27d2bc7ecd7590fca48932b1770d126e5c6b2763595f4c8ed08004803eab1b2c	[0.017300256,-0.011784031,0.02237401,-0.015236293,-0.011918109,0.01842743,0.027770862,-0.03933334,0.018409485,-0.06383501,-0.017093748,-0.013716881,-0.023504475,0.0028720156,-0.0064214836,0.035388507,-0.020508476,0.0042318343,-0.003989922,-0.032104287,-0.011535875,0.0078975335,0.008891092,-0.011966286,-0.028138218,-0.043057308,0.012530204,-0.004385587,-0.01915815,0.25831613,0.038794458,-0.012177723,-0.010153379,-0.038538244,0.031482935,-0.019089764,-0.0100134965,-0.042021118,-0.028669015,0.0062568267,-0.01827967,-0.007990265,-0.03498178,-0.0082949735,-0.03585854,0.003154775,-0.024712073,0.0045799995,0.014562078,-0.03857277,0.019967258,-0.045387167,0.02777608,0.030297266,0.0116674015,0.029665573,0.025791107,-0.0034634022,0.0046938155,0.003771695,0.023527997,0.013042819,0.015574329,-0.032550283,0.011979695,-0.018670138,-0.005082679,-0.0042953924,-0.003540185,0.023166688,0.0059599048,0.024088774,0.029451495,0.046235718,-0.026140263,0.013774631,-0.009484753,0.020856775,0.012129069,0.044475798,-0.012582603,0.02056513,0.0043876087,-0.013054376,0.033175603,-0.037575986,-0.0080252765,0.017936323,-0.0052430253,0.032166187,-0.026267806,-0.00091108814,-0.023431277,-0.009015277,-0.0071074096,0.001174615,-0.015378081,0.0119888475,0.019390212,0.024449112,-0.008732525,0.017597714,0.0021653876,-0.018724997,0.036718488,-0.034130007,0.0044663954,0.0025864928,0.06334416,0.011278807,0.02239472,-0.2893109,0.023742815,0.025817163,-0.03005683,-0.072037935,-0.0027802128,0.043039158,0.072466455,0.036719207,0.007252193,-0.0049994313,-0.007655547,-0.06694208,0.024003431,0.015517591,0.017872127,0.010634138,-0.006531656,0.055063132,0.006590947,0.032184966,0.00581841,-0.019954832,0.005625107,-0.0013537834,-0.055186156,-0.018595964,-0.010510696,-0.021919189,-0.031395897,-0.027608503,0.020003363,-0.022885175,-0.026793538,0.017544188,0.015069111,-0.010832167,0.05327782,0.015689656,0.005304233,0.0041266913,0.0024164713,0.016592277,-0.014785027,-0.042135846,0.022383152,0.017027946,0.02329731,0.08702499,-0.039479278,0.014486724,-0.02992807,0.0244014,-0.031488057,-0.026859852,0.021902613,0.053823207,-0.035713967,-0.016049158,-0.02674828,0.058241684,-0.014858198,-0.019866426,-0.011801721,0.022796864,0.014733077,-0.0028027208,-0.006437893,0.0044900076,0.000817493,0.013565963,-0.07230876,0.012777299,0.038020633,-0.02453379,0.039985497,0.0104686655,0.032109257,-0.0087498585,0.017043294,0.037188783,0.0032487286,-0.011410317,0.043587293,-0.009905813,0.03747889,-0.012373919,0.019273635,-0.010906956,-0.023380833,-0.011388075,0.040337224,-0.017922463,0.009752767,-0.025037384,-0.006112009,0.025628882,-0.00083362625,-0.049021248,0.019694105,-0.014034005,-0.0238677,0.0130955195,0.039178107,-0.0008048793,-0.022225752,0.04289547,-0.018709743,-0.0043544606,0.0028572786,-0.03189493,0.018314736,-0.01904395,-0.01030917,-0.04634658,0.019989379,-0.022201797,-0.006308594,-0.0032822094,0.013899484,-0.0069302795,0.026832093,0.012298631,-0.02034042,0.00237786,0.023189843,0.03235364,0.041588277,-0.020460583,-0.036370054,-0.029031117,-0.0015230742,-0.004091355,0.021539994,-0.042991098,-0.021179358,0.031696983,-0.012858002,-0.021508541,-0.05085483,-0.010056336,0.011457303,-0.021592906,0.012403468,2.534636e-05,-0.0059727044,-0.0031458945,-0.011120143,-0.046838082,-0.021905266,0.03679225,-0.011205041,-0.010851825,0.050225876,-0.02088051,0.006478933,-0.0062803635,0.09771807,0.015668496,0.02395654,0.05619385,0.012767275,-0.03006174,-0.010187465,0.047858033,0.0011256004,-0.0077110617,-0.03444067,-0.035549738,0.01096037,-0.02215167,-0.024923615,0.021492079,-0.010229815,0.033379953,-0.035567068,0.028814651,0.017166112,0.0010572714,0.04390559,-0.011606419,-0.011084983,-0.031608053,-0.015591161,0.024037054,-0.012084471,-0.021007383,-0.024653764,-0.002440013,-0.01570954,-0.00039779177,0.01854457,-0.020353366,-0.009960734,0.007845845,-0.004817806,0.028700909,0.023405274,0.028431334,-0.008025119,0.0024600944,-0.014660836,-0.01561198,-0.019482639,-0.019390544,-0.02815185,-0.0043133497,-0.0014388143,-0.19907433,0.063455105,-0.014959657,-0.03321694,-0.02684244,0.02790263,0.010539847,-0.022325125,-0.041492667,0.0076587205,-0.033495396,-0.03508774,0.030353582,-0.007351979,0.014020803,-0.023413068,-0.014734545,-0.031355888,0.022738531,0.0018910149,-0.014421087,0.005003796,-0.3471366,-0.018848563,0.04983663,0.027762672,-0.018900923,-0.007709073,0.010492421,-0.008670248,0.015315548,0.018863337,-0.008053317,-0.012988598,0.02861869,-0.025406823,0.030914601,0.0046108896,-0.026775602,-0.018232321,-0.008696247,0.006214867,0.007881368,0.0021180739,-0.005678936,0.0155854,-0.027154444,-0.043777186,0.042789586,-0.0109039005,0.01680736,0.036573898,0.02766839,0.04471269,0.009869203,-0.019453857,0.0016895451,0.006144499,0.029132053,0.026388776,-0.05381648,0.04452957,-0.009369721,-0.03232564,0.0028196785,0.05170646,0.0013865918,-0.052506898,-0.03863137,0.012379606,-0.049119797,0.040293094,0.06153582,-0.025648776,-0.0042179427,-0.0033707519,-0.06059805,0.0012242551,-0.04850814,0.034619626,-0.01451901,0.005002708,0.0025872977,0.0021567142,-0.008958079,-0.012987117,0.015046924,0.04326711,-0.0011798013,-0.034292508,0.003087849,-0.00953046,-0.030727644,0.042902887,-0.04756113,0.0095339175,0.038016584,-0.040132158,0.05207129,0.028824016,0.0044941283,-0.02119117,0.016670594,-0.004879797,0.0025545894,0.007186893,-0.037615318,-0.0018074404,-0.009792828,0.0042195697,0.006744358,-0.0072366167,-0.013402048,-0.028699704,-0.034246944,0.02176448,-0.03946643,0.0058087786,-0.021146733,0.04219603,0.017457705,-0.023922058,0.011486395,0.01956209,-0.035319075,0.013884032,0.071198754,-0.039218176,0.027082454,-0.0267268,0.038606603,0.07929399,0.018829195,0.023202885,-0.023654545,-0.013713943,-0.021502933,-0.01771283,-0.0021229282,-0.051157244,-0.0027867146,-0.035745513,0.011762788,-0.006065781,0.024208011,-0.0050394977,-0.021014223,-0.024292583,-0.02254879,0.035804007,-0.05762739,-0.030437283,-0.006329659,-0.004478111,0.033622377,0.0043084556,0.048232824,0.014102368,-0.0036416627,0.0104281055,0.015021042,0.021658273,-0.01705687,0.0008240175,0.012689123,0.00056320615,-0.05502056,0.0011446284,0.03876972,0.01388123,0.0029495033,-0.022751113,0.0030681998,-0.057386227,0.007690898,0.03334501,0.021738859,-0.0064751976,0.01568815,0.04528323,-0.018252669,0.02559265,0.026983963,-0.017991832,0.008759666,0.015772786,0.003570133,0.023369672,-0.2963196,0.032155477,0.015148628,-0.0065859295,0.03907615,-0.01818347,-0.0008773593,-0.03689404,0.005454736,-0.0398031,0.021001823,0.021095969,-0.09398798,-0.03065677,0.021423262,0.0059012175,-0.013490145,-0.0009211217,-0.026831685,-0.047050647,-0.026778637,-0.035213154,-0.018251266,-0.008548917,0.008786232,-0.013260059,0.021883572,0.037761785,-0.0016108792,0.024574636,-0.019374697,0.014273208,-0.033534028,0.002390096,-0.0039054637,-0.045892414,0.023895465,-0.05008834,-0.028806759,0.02734117,0.013909883,0.03146783,-0.022545014,-0.017657274,0.010646529,0.019928506,0.018096035,-0.11547287,0.0068107056,0.004930209,-0.006865983,0.0087677045,-0.02180942,0.02855297,0.004635232,0.011099958,-0.0042452244,-0.039458126,-0.013237836,-0.00971929,0.013515905,-0.012829742,0.006940535,0.0010950117,0.069727965,0.042751804,0.027327571,0.15800488,-0.008330906,0.021046715,-0.0124337645,0.02079398,0.007396829,-0.008939059,0.019239264,0.0016819665,0.0064905887,-0.013224806,0.008177835,0.04521745,-0.024197577,-0.022376128,0.008873864,0.008864997,-0.0049620788,0.042806108,0.010316409,0.020402405,-0.0072611547,0.0262184,-0.006969626,0.03636576,0.060444668,0.012021529,-0.00871045,0.034647726,-0.025024975,-0.02381414,0.02952271,0.036952805,-0.057152864,0.027996453,-0.020362437,0.015543845,0.028389586,-0.006235602,0.0017536951,0.0034550834,0.035668384,0.02201324,-0.006965467,-0.003032809,0.030637395,-0.012970164,0.018727079,-0.02418191,0.01858576,0.014793959,-0.052583914,-0.038355723,0.014317837,-0.021002179,0.036098104,-0.019286728,-0.01752451,-0.023650525,0.0044873357,-0.025014143,-0.0020794228,0.05557729,-0.020353856,0.0015900637,0.04667983,0.0060017738,-0.0056258286,-0.047334757,0.04379219,-0.012031621,0.028932039,-0.03237978,-0.017082965,-0.020075947,-0.016052742,-0.030799264,0.016521903,-0.010800372,-0.060880028,0.057014473,0.03905382,0.0069357236,-0.015605721,-0.016722182,-0.038130783,-0.014612122,0.003465371,-0.020699047,0.03559728,-0.009279959,-0.029603438,-0.0066145645,0.064833514,-0.0075161457,0.0129391365,0.016462645,0.0109642055,-0.070707195,0.010936571,0.016202575,0.038244914,-0.010640272,0.018056862,0.0068280855,-0.016717484,-0.012672534,0.0027227537,0.020515198,-0.03394241,0.062647335,0.02395659,-0.03246784,-0.011817467,-0.035785284,-0.033888623,-0.027474103,0.06030233,0.039315246,0.0011621681,0.039438803,-0.027149227,0.0339286,-0.037783157,0.006310114,-0.040731497,0.024711799,0.022500752,-0.027321324,0.022023099,0.024967348,0.017999219,-0.023085358,-0.019785043,-0.022371367,-0.026659014,-0.012939215,-0.039807927,0.007874551,-0.0044201296,-0.06389051,-0.059107658,0.03623853,0.018363282,0.036049616,-0.014565613,-0.012095959,0.025796613,-0.0046503237,0.029388055,0.0009169159,-0.0019813655,-0.051103048,-0.02297953,-0.0106590325,0.00573406,0.012884828,0.02279922,0.085795075,-0.017865049,0.02641256,-0.036178287,0.006086094,-0.04538747,-0.018184248,0.03218325,0.05024307,-0.022252375,0.03433418,0.0046611726,0.024953866,0.011090912,-0.0044583473,-0.026822686,0.044086426,0.06080779,-0.01636521,0.013594789,-0.03752668,-0.0007048775,0.05402488,-0.006662466,-0.022383735,-0.019700361,0.011784629,-0.038818847,-0.019032689,-0.018716434,-0.014915775,0.0062081288,-0.04239174,0.0017772227,0.023750082,0.0038829981]	2026-09-08 09:32:54.310023+00
23	achievements	1	0	Matematika fanidan viloyat olimpiadasi g'olibi	Maktab yutug'i\n\nNurmatova Zilola — o'quvchi, 9-A sinf. Yutuq: Matematika fanidan viloyat olimpiadasi g'olibi. Daraja: viloyat. Sana: 2026-03-14. Viloyat bosqichida birinchi o'rinni egalladi va respublika bosqichiga yo'llanma oldi	/achievements	5507edef00c52377925e1b0668676892fc2611628880d1ae7ab9bed076ebc891	[-0.015272717,0.022385156,0.042769622,0.023529332,-0.03021631,-0.0114658205,0.01883649,-0.0089944415,-0.018503787,-0.093408674,-0.026528608,0.025408471,0.031667106,-0.0018415223,-0.00926876,-0.005247972,-0.005119697,0.003857562,-0.016223516,-0.045226928,-0.041227173,0.028375115,0.033224776,0.021198943,-0.023677323,-0.03141122,0.03145312,-0.046400174,-0.01781551,0.22481275,-0.010740615,-0.019740244,-0.0122860605,-0.033493895,0.033762053,0.011608525,0.01871807,-0.045584295,-0.0444907,0.022566121,-0.0022350405,-0.028734645,-0.012096529,-0.0023552969,0.00784814,-0.015791096,-0.007961033,-0.0024136512,-0.027318906,-0.0128484275,-0.0007793641,0.0151304575,0.055321936,0.051537454,0.014794591,0.062042244,-0.0049776724,-0.0048341765,0.00051780255,0.018178154,-0.006179579,0.05751723,0.031039845,0.009087335,0.036704842,-0.037933286,0.04604667,-0.008019403,-0.0050990656,0.011240184,0.05421797,0.00888886,0.009060203,-0.0014268708,0.011915307,-0.0014594467,0.025153633,0.02568159,0.011342838,0.020380499,-0.0160383,0.011670519,-0.025697973,0.009950454,0.03929492,0.024242563,-0.0058752913,0.006279163,-0.021561753,0.0149825355,-0.01598737,-0.00919899,-0.0033022836,0.010081406,0.0027060364,0.00048614907,-0.01056413,0.042235408,0.026582353,0.044370435,-0.0082519725,0.015996035,0.0012933582,-0.0088532735,-0.01915163,-0.04767699,0.01826749,0.035741515,0.0027455771,-0.0049089952,-0.012497464,-0.298548,0.033144522,0.009919879,-0.035830114,-0.07179229,0.011066495,0.0257403,0.051174838,0.014410096,0.02333915,0.029240277,-0.017028337,0.0025988242,-0.008493673,-0.0021405586,0.022114474,0.006341199,-0.032409698,0.05706394,-0.028532485,0.04626343,0.024048219,-0.020857248,-0.010298195,0.023790574,-0.00036284572,-0.014273127,0.0098219495,-0.016851664,-0.03872378,-0.019316802,0.029340038,-0.0038142677,-0.020914992,0.0023591304,0.01222389,0.059792317,0.02678133,0.040262982,-0.00522822,-0.0067548836,-0.008402884,0.024263335,0.008019655,0.03606537,-0.027106883,0.061504915,0.019634845,0.030844389,-0.015201673,-0.03212723,-0.017017918,-0.01750564,-0.04678983,0.0021815766,-0.0093917865,0.05178884,-0.010848384,-0.0056215324,-0.021295298,0.013601029,-0.026929373,-0.0072280746,0.03568816,0.014228985,0.012331928,0.0046693296,0.017396988,0.04006096,0.031632006,-0.025788326,-0.049156852,0.008291847,-0.0121017285,-0.005482032,0.043741662,-0.022610266,-0.019611264,0.03415482,-0.007669184,0.0020984292,0.0071092993,0.019175967,0.037376225,0.0080503095,-0.014736712,-0.00057921384,-0.01058482,0.015634257,-0.023928076,0.0014492798,0.047412362,-0.025331995,0.010231544,-0.0058711194,0.023824904,0.042974204,-0.0072537516,-0.006338223,0.049405523,-0.0130572375,-0.03979932,0.002687527,-0.030718269,-0.026482198,0.041535344,0.051212326,-0.020447034,0.0030845094,0.015790017,-0.02064221,0.0009253259,-0.02078209,-0.020399047,-0.024477197,0.040551763,0.025896389,-0.016020259,-0.023099486,0.012403883,-0.02351803,-0.015598904,0.0017180429,-0.025049767,-0.019661091,0.023619348,0.012771989,0.028084164,-0.009783851,0.025056321,0.01610966,0.03198026,-0.016031118,0.011734338,0.010410952,0.02329137,0.006126401,-0.026105052,0.029222526,-0.017376926,0.008431535,-0.007264684,-0.03179239,0.025893122,0.030394964,0.023496903,0.0015684671,-0.051553037,-0.07690305,0.05073584,-0.024563642,-0.011160302,-0.00797797,0.01929812,-0.03185838,-0.015785068,-0.04441477,0.054598972,0.011601656,-0.022119755,0.031110642,0.003895387,-0.03800246,-0.004045274,0.031155234,-0.0022560651,0.013512908,-0.013827442,0.0101140775,-0.012701713,-0.041350443,-0.014359469,0.022410002,-0.007899233,0.009589128,-0.053190503,0.026074223,0.008546339,0.016137466,0.0072571835,0.020137517,-0.0008666404,0.0085851755,-0.008336254,0.018681299,0.0050015897,-0.015042967,-0.023422852,0.010267371,-0.008966985,-0.017238129,0.0029075048,-0.003419894,0.0041963174,0.0101613905,-0.0025496345,0.0027195907,-0.017559879,-0.013509537,-0.013441835,0.0011330434,-0.049444087,-0.054691948,-0.00047303695,-0.014976329,-0.051750008,0.0049038935,-0.027207378,-0.20004353,0.048432376,0.017397624,-0.004579735,-0.040873006,0.001162593,0.020569505,-0.042395215,0.0013631574,-0.027706448,-0.027245447,0.014835096,0.05103853,0.0016883821,0.0075293756,-0.017161265,-0.00829872,-0.013589333,-0.0075276573,0.020828051,-0.037597623,0.0021567466,-0.3469402,-0.0024215856,0.04064266,0.029420605,-0.010401008,0.0025401132,0.03335975,-0.0013852121,-0.0040596584,0.010038744,0.023273978,0.014753073,0.03447893,-0.0051690936,0.028974924,0.021536237,-0.032607097,-0.022838796,-0.026995817,-0.008026208,-0.017293641,0.030215485,-0.025988786,-0.025175804,-0.014302637,-0.024120381,0.054347552,0.029731866,0.027288161,0.05046881,0.018800078,0.033851024,0.03649495,-0.025826897,-0.04991854,-0.016645448,0.00862367,0.016134258,0.027038492,0.038098883,-0.06086561,0.0148627,0.03380858,0.052677166,0.025569806,-0.0444435,-0.030152077,0.013663294,-0.019789387,0.009812273,0.048295945,-0.059065852,0.0007102984,-0.0013995592,-0.044164117,0.020205267,-0.024655655,-0.0008955865,-0.049291916,0.009115067,0.010295496,0.015648928,0.01641191,0.023785738,0.03373536,0.010580354,-0.047286373,0.008074635,-0.01961381,-0.04572918,-0.030902654,0.021313243,-0.0032467574,0.0070246467,0.026970642,-0.029688502,0.0048227524,0.0035635498,-0.025447497,0.0067461557,-0.011179286,0.021782361,-0.03744533,0.0014059743,-0.031390533,-0.004336913,0.009220765,0.023467135,0.017117806,-0.036295976,-0.031072494,0.017922139,0.015921023,-0.0010447905,-0.016263926,0.057107255,-0.033578977,-0.011849538,-0.030696863,-0.0072181956,-0.039095264,0.009660054,-0.023694107,0.007635998,-0.0050689736,-0.030538311,0.022488521,-0.058221705,0.0054024323,0.045314822,0.03807454,0.006277575,-0.011483156,0.020132236,-0.031347077,0.0108052865,-0.039615557,-0.009199116,-0.0104362285,-0.026913283,-0.0042861025,0.04554369,0.012698631,0.022380564,-0.04129652,0.010560003,0.0071231374,0.009101457,-0.01547383,-0.032051034,0.025453797,0.041573126,0.015757276,0.041820798,0.018182604,0.011049967,-0.023902426,-0.021259105,0.008439861,-0.034641154,-0.01231886,-0.0117971115,0.021399543,0.01975797,-0.042723335,0.009240462,-0.0065015783,0.026462117,0.04394181,0.025329819,0.011489536,-0.024471147,0.04184311,-0.012078205,-0.00960219,0.013454082,-0.011305266,-0.007983404,-0.010932112,0.060325403,0.008052184,-0.009291627,0.013669329,-0.014678367,0.016559925,6.836578e-05,-0.30512637,-0.02059727,0.011534885,-0.019059023,0.030618675,-0.018113613,-0.009987053,-0.01659758,0.045461968,-0.010540756,0.039947484,0.009683239,-0.06635217,0.0120226145,0.00037158525,0.0032407276,-0.010325325,-0.020749127,-0.043628614,-0.010388245,-0.0137804765,-0.008014633,-0.068669006,0.019121673,0.014072015,-0.056715023,0.032395676,0.0118742315,0.0018780748,0.025585555,-0.031878877,-0.0059962086,-0.016160283,0.030010732,0.0042600716,-0.010629399,0.04723004,-0.017283075,0.0149808815,-0.04321971,-3.4869063e-05,0.043521795,-0.010994967,0.010494187,0.030331677,0.0029548905,0.019133694,-0.13530919,0.0152473105,-0.013820166,0.011953657,0.066090524,-4.214536e-06,0.028782131,-0.00967704,0.03597587,-0.015279116,-0.023647858,-0.02345089,-0.053108577,0.0008683185,-0.056637276,6.8944064e-05,0.0009901666,0.06934829,0.06511116,-0.0005950844,0.16540262,-0.023949157,-0.009513724,-0.022983588,0.006171974,0.015602865,-0.012757805,-0.0036094103,-0.0015156884,-0.032005385,0.026962819,0.026586883,0.02763826,-0.0095301345,0.0109284,0.03280197,-0.016435158,-0.0042501735,0.047267936,0.03215282,-0.016727021,-0.006286382,0.034538627,0.041969437,0.0063951383,-0.0022937346,0.01697973,0.0078061405,0.024446607,0.019735325,-0.023185462,0.0057772356,0.017474776,-0.06635326,0.028690804,0.0025697725,0.008158017,0.011083455,-0.019896105,0.023772554,0.0052692546,0.012419305,0.048352834,-0.016189175,-0.0035458424,0.010580981,-0.043884005,0.019798221,0.037032433,-0.031476784,0.022973264,0.022683226,-0.010206107,-0.027258275,0.012563425,-0.038054153,0.040931515,-0.055918533,0.02684762,-0.006908262,-0.0096350415,-0.049366377,0.064610735,-0.026341084,-0.0056551276,0.055453278,-0.0060750237,0.020758206,-0.015147971,0.03528317,0.0033129808,0.00071378134,-0.0004319895,-0.023709917,-0.022561135,-0.0031133487,-0.028812323,0.029789807,0.0021109588,-0.031629626,0.022808496,-0.018111803,-0.009162315,-0.021873688,-0.019009162,-0.028459,0.0010638613,0.030444518,-0.012939793,-0.009323918,0.0054324735,-0.036086366,-0.018350735,0.034091875,0.018277137,-0.021881133,-0.015445868,-0.012427657,-0.010130859,-0.0028038828,-0.02299889,-0.0072611785,-0.0006981985,-0.030002668,-0.012140778,-0.05842507,0.015247958,0.04845086,0.043604095,-0.022651052,0.016420988,-0.028514182,-0.018509634,-0.02662413,-0.017918054,-0.01294983,0.0013682151,0.018705472,0.037888274,-0.047292717,0.02812277,-0.00496251,-0.0034485103,-0.046281975,0.003788898,-0.021744959,0.05227068,0.010067383,-0.012243686,0.022525221,0.042783264,0.0023144193,-0.033669,-0.038430076,0.004997363,-0.041687466,-0.012993007,-0.06379419,0.04357811,-0.02111538,-0.0363555,-0.015036222,0.03656552,0.037604064,0.049278088,0.011979033,0.01863449,-0.00763296,0.016701937,0.06821535,-0.027306786,0.028529586,-0.045118403,0.011343583,0.013922236,-0.024835836,-0.041856002,0.029299375,0.090250224,0.025970582,-0.003838743,-0.062574744,-0.0059484774,-0.050244134,0.001098111,0.03731325,0.022708442,-0.021583198,0.05098038,-0.009562526,0.037125815,0.0017970268,-0.0039395574,0.015378531,-0.014193457,0.008921626,-0.0033738362,0.029545823,-0.02435522,-0.022718014,0.0617569,0.02536911,0.0101451,-0.03740791,0.018090405,-0.01678919,-0.010151615,-0.04386863,-0.020539843,-0.034021158,-0.033243876,-0.03496526,0.034654725,-0.024677599]	2026-09-08 09:32:54.310023+00
24	achievements	2	0	Informatika bo'yicha respublika tanlovi sovrindori	Maktab yutug'i\n\nSobirov Jasur — o'quvchi, 11-B sinf. Yutuq: Informatika bo'yicha respublika tanlovi sovrindori. Daraja: respublika. Sana: 2026-04-19. Dasturlash yo'nalishida uchinchi o'rin	/achievements	0107fa7d3c699405219cbf3e68754514d2a56885c003e42aab8d256e1b1208be	[0.0040283925,0.033921886,0.028114572,0.02761894,-0.013302865,-0.015540551,0.010112475,-0.03197171,-0.0018319355,-0.08640151,-0.028861659,0.021964354,0.009157727,-0.00571615,-0.02558482,0.006689808,-0.014399188,0.017629094,-0.014691099,-0.024199191,-0.027305944,-0.028556705,0.015989665,0.022971261,-0.023827106,-0.027298378,0.019018482,-0.015214163,-0.07041439,0.23802334,0.014242198,-0.005230236,0.0025822483,-0.033718202,0.029239096,-0.019230027,0.016441802,-0.039458998,-0.03475768,0.02136254,-0.003821239,-0.02618285,-0.002055979,0.024685593,0.020169107,-0.035472788,-0.041191977,-0.005730451,-0.026560478,-0.022670599,0.00855797,-0.031605348,0.039158523,0.037856746,0.03151841,0.04650145,-0.031397752,-0.003869836,0.00969886,0.034614727,0.022976551,0.017325163,0.035793137,0.010460864,0.038661137,-0.05493181,0.036826484,-0.010068187,0.006833955,0.002819128,0.012944148,0.03343756,0.0057542035,0.0029300444,-0.0040568123,0.007889022,0.015069051,0.041459713,0.030100374,0.01432296,-0.0017196368,0.042590793,-0.0040114634,-0.0097888475,0.029882317,0.036449656,-0.025413165,-0.0073521524,-0.044125196,0.029601185,-0.04393775,-0.007278585,-0.021064525,0.031442568,0.010167146,-0.0047639147,0.0053724204,0.021802753,0.018870385,0.024961386,-0.032198634,0.032635074,0.008832537,0.006336157,0.0039406167,-0.034852404,-0.0076888665,-0.00081127306,0.010532723,0.00921976,-0.005480639,-0.29004684,0.0007495246,0.009421553,-0.048797656,-0.073313616,0.017164955,0.00974773,0.08802246,0.04001544,0.032447673,0.022756841,0.0014799428,-0.01610678,-0.015545448,0.0045629954,0.054478798,0.0024478787,-0.051843066,0.04186965,0.006741753,0.05615548,0.043487124,-0.05509306,-0.027482586,0.0077250744,-0.0478036,-0.036672093,-0.011677195,-0.015972476,-0.043686032,-0.025904363,0.019308133,0.008781086,0.0037609492,-0.012888677,0.021544967,0.049771354,0.05728172,0.048659272,-0.0022893876,-0.033109948,-0.00643859,0.038565714,-0.008512591,0.013713131,-0.0035080516,0.05116181,0.0003947268,0.025542365,-0.023590803,-0.006490569,0.021705735,0.0144153,-0.016827613,-0.001295625,-0.008592067,-0.0049703894,-0.0151862735,-0.003661726,-0.035840243,-0.0043392046,-0.025304094,-0.01075392,0.04383066,0.0030709726,-0.0015019685,-0.0056639467,0.030620689,0.0145538105,0.04789479,-0.035878755,-0.0002640257,-0.022087121,-0.008725738,-0.0052929404,0.020677652,-0.0059747114,0.040716536,0.053044397,0.019478368,0.0066787377,-0.002431802,0.021586841,0.045429084,-0.0048213913,-0.0039973543,-0.022096062,0.018687239,0.012123833,-0.026505448,0.010125781,0.05381341,-0.013087969,-0.007348938,0.026397632,-0.005301332,0.051861484,-0.027304672,-0.051497526,0.019099444,-0.05875683,-0.025445487,-0.035972647,-0.0045743682,-0.015429587,0.013173164,0.013100375,-0.029986411,-0.012634737,0.016853191,-0.0012832432,0.026443737,-0.009349835,0.0030040322,-0.03923583,0.056472093,0.01970683,0.0040771593,-0.04342809,-0.0052099642,0.002873812,-0.0040234746,-0.011660532,-0.015500973,-0.022095371,0.055478163,0.042230703,0.00798893,-0.0031492442,0.0076497435,-0.009114905,0.025392631,-0.019263323,0.025378238,0.012841391,0.0143500855,0.019371536,-0.032556638,0.009670832,0.008788586,0.0029244786,-0.0034522084,-0.034916993,0.020143194,0.036413163,0.02962277,0.006362145,-0.047347743,-0.08675879,0.03351463,-0.017272973,-0.022324635,-0.016617987,0.0040678973,0.0022486467,-0.021552151,-0.056815017,0.037429396,-0.008566123,0.0018168414,0.034639608,-0.026211089,-0.017475931,0.009675134,0.0126694245,-0.034365032,-0.014806735,-0.026148165,-0.012986188,-0.0018850242,-0.014239302,-0.0025699646,0.01395357,0.0036644489,0.021863377,-0.03790886,0.013803182,0.0070288735,0.0026599588,0.02615859,0.039575707,0.011689126,0.02451525,-0.03157164,0.0088913785,-0.008365134,0.016647866,-0.0022139223,-0.009501803,-0.006551245,-0.022155313,-0.0011770809,-0.003173611,0.03007328,0.004144802,-0.024942731,0.021018788,-0.02621239,-0.014504463,-0.0072577056,-0.02819057,-0.027165566,-0.0467405,-0.02385631,-0.020505795,-0.03578972,-0.0038695624,0.02637428,-0.1739988,0.022144753,0.016495477,-0.012943056,-0.045063622,0.003473103,0.022805098,-0.012575604,-0.022908596,-0.032071408,-0.055200197,-0.016134804,0.02647638,0.01416743,0.017578652,-0.00051945326,-0.0058036176,-0.02950326,0.014547363,0.026863115,-0.025139144,0.010211421,-0.3395412,-0.022568492,0.034887023,0.03804938,-0.018261021,-0.013169019,0.03494837,-0.0025424985,0.011507473,0.017717252,0.01927334,0.00481212,0.0053693107,-0.029918766,0.01021203,0.010863747,-0.032474976,-0.002357285,-0.020407801,-0.017955612,-0.008649479,0.024289358,0.004298151,0.0042308965,-0.010672539,-0.0196767,0.0148586845,0.060041163,0.014419494,0.045794386,0.011998398,0.043419857,0.047501106,-0.0040464965,-0.02678936,-0.022712337,0.0085841175,0.0011191987,0.007339814,0.062909976,-0.009578939,0.014892322,0.044932052,0.069873825,0.005781566,-0.0636695,-0.009922753,-0.009738499,0.011002504,0.037503283,0.06615479,-0.07543379,0.00066320045,0.010830224,-0.006392375,0.011147168,-0.013950122,-0.028177667,-0.014008606,-0.026399584,0.010415124,0.03730646,-0.023330308,0.013317224,0.04322782,0.021848105,-0.016278544,-0.01589145,-0.017822865,-0.068796396,-0.030942012,0.006589277,0.008726608,0.040440846,-0.010883204,-0.030719297,0.02307493,0.016823241,-0.0036676442,-0.014029607,-0.006908981,0.017180044,-0.03862588,-0.0039303093,-0.049707096,0.0013032809,-0.012426785,0.017640917,0.0052671,-0.042933285,-0.040615905,-0.00067616475,0.00027108405,0.009381241,-0.04073648,0.02469157,-0.01186146,-0.04319468,-0.032726146,-0.036407385,-0.006028224,0.024640964,-0.04891777,0.016055802,-0.012711026,-0.01645223,0.009931118,-0.06409239,0.040386803,0.014051548,0.017929265,0.004320981,-0.004964082,0.006747176,-0.020144355,-0.0081984885,-0.0107058445,-0.010498084,-0.014383163,-0.030869117,0.009291672,0.037310332,0.020322789,0.013492947,-0.039626937,0.02774859,-0.035019424,0.018319838,-0.026718514,-0.021993034,-0.010197333,0.04327907,0.04053844,0.031120729,0.001813765,-0.013827669,-0.03528634,-0.0007368691,-0.01563685,-0.039977428,0.0018848316,-0.012495873,0.04298483,0.043449182,-0.030221201,0.035869334,-0.026122237,0.036879286,0.051134743,0.017020145,-0.010818999,-0.01635871,0.032750495,0.015457292,-0.017802335,-0.017110974,-0.015428426,0.0026822148,0.0055087134,0.03774955,0.009265326,-0.035606503,-0.011692556,-0.0006011602,0.056218497,0.002602668,-0.28708515,-0.012248621,0.040584657,-0.02574587,0.006523623,-0.028190639,-0.02587246,0.0051056086,0.011401569,-0.009033311,0.055001203,0.010087144,-0.04789116,-0.010530369,-0.014455713,0.0085711675,0.0011506713,-0.031794086,-0.010709905,-0.050039828,-0.009897866,-0.0016953248,-0.043887444,-0.0050435113,0.011894204,-0.05674906,0.038071487,0.017091814,0.014132366,0.058072828,-0.020283045,0.019081311,-0.030596316,0.009878694,-0.0007192019,-0.017181564,0.054732747,-0.013246664,0.009812666,-0.03474421,0.013926294,0.04939101,0.00062115147,-0.017573709,0.032042097,-0.019371819,0.029376449,-0.14055687,0.008541077,-0.0056579164,0.018302409,0.04599073,-0.044153173,0.020370394,-0.011724629,0.033896632,-0.01627717,-0.02840174,-0.03422948,-0.053846084,0.012882,-0.04057321,0.024521254,-0.016291887,0.05274278,0.0427065,0.015158813,0.17427589,-0.00585013,0.0051007536,-0.02727476,0.013170578,0.01147412,-0.012368524,-0.019661661,-0.01533953,-0.03575539,0.00038979505,0.02783063,0.023841474,-0.028892165,0.008752227,0.031386893,-0.0145244775,-0.016999355,0.06394485,-0.0013808273,0.012482666,-0.02792214,0.02944354,0.03268928,-0.023252346,0.02988954,-0.0026470402,-0.00789141,0.01481027,0.015290071,-0.012565874,-0.020305702,0.02030695,-0.079703,0.05302052,-0.0012425047,0.03324876,-0.021846743,-0.007415159,0.009836448,0.0050869933,0.05763653,0.008468009,-0.01875793,-0.012057385,0.019927198,-0.036002092,0.023334607,0.017258937,-0.017872928,0.021102741,0.01575125,-0.03382929,-0.025174676,0.009177379,-0.067933165,0.021905245,-0.034488413,-0.011517552,0.0076020933,0.020032583,-0.036064792,0.050150383,-0.033362992,0.006088816,0.028907347,-0.014912047,0.0095934365,-0.0018388447,0.026877338,-0.016041238,-0.0142267635,-0.03569839,-0.0142114265,-0.02728364,-0.01272977,-0.002302326,-0.012151893,-0.015231033,-0.018694283,0.025052018,-0.0018439821,-0.019924676,-0.033429127,-0.022917148,-0.024469715,-0.03099576,0.03915255,0.0068694935,-0.0047242143,0.046345863,-0.031855326,-0.00098048,0.006972645,0.009552451,-0.03459936,-0.033401217,-0.039388243,-0.06226209,-0.019992547,0.0017431389,0.02016902,0.03712137,-0.038471762,0.0095197195,-0.019360567,0.02515302,0.03701049,0.02260974,-0.020284226,0.012737096,-0.036196377,-0.0039789034,-0.04776544,-0.005484438,-0.016632808,-0.023430098,0.05057799,0.039564043,-0.02052672,0.021592567,0.0038396663,-0.013924695,-0.034014583,0.025099583,-0.057919316,0.03237237,-0.010766798,0.002510382,0.018224344,0.043827947,0.010173117,-0.0093708495,-0.05348423,-0.0027397042,-0.025762642,0.0010764397,-0.047864705,0.027416604,-0.022424929,-0.018869162,-0.013260252,0.008211686,0.04482049,0.03630135,0.019991267,-0.006846858,0.009058595,-0.013571552,0.018688766,-0.0177481,0.004651234,-0.034146026,0.022109259,0.010986531,-0.029278737,-0.026631521,0.029793406,0.098897636,0.056715816,-0.008046746,-0.037800413,-0.020333624,-0.063027844,-0.00905596,0.018977571,0.0056575257,-0.022735141,0.048148826,-0.008062766,0.016689863,0.0016825856,-0.029231012,0.0066052694,-0.006638765,0.019998051,-0.0033319858,0.020442808,-0.01818414,0.022328274,0.04794003,0.029900456,0.00014432511,-0.05898439,0.0052521788,-0.018838124,-0.03356559,-0.04436521,-0.015507174,-0.021375665,-0.035492796,-0.015567487,0.053673152,-0.009772427]	2026-09-08 09:32:54.310023+00
25	achievements	3	0	Yilning eng yaxshi o'qituvchisi	Maktab yutug'i\n\nRahimova Dilnoza — o'qituvchi. Yutuq: Yilning eng yaxshi o'qituvchisi. Daraja: tuman. Sana: 2026-05-09. Tuman miqyosida yilning eng yaxshi o'qituvchisi deb topildi	/achievements	d195fecbb36353e377e6885666ad748f46aa435740f5746f13875db6efd1f693	[0.00256416,0.036235925,0.004470218,0.016892899,-0.0020024793,-0.020402933,-0.011817991,0.0057432507,-0.014879104,-0.105733134,-0.0360719,0.030838288,0.0017777443,0.017201511,-0.033767983,0.020677067,-0.02008445,0.0060292687,-0.0382728,-0.05474468,-0.03590023,0.00052968995,0.034700092,0.0318855,-0.047099892,-0.024417665,0.03884255,-0.03529375,-0.04287611,0.23145507,-0.028788457,-0.027938807,-0.017902581,-0.013628127,0.007317826,0.00033701916,0.021972291,-0.022340126,-0.028095607,0.04959798,-0.018449293,-0.007082472,-0.01747183,-0.0049669784,0.01651633,-0.035668973,-0.02796974,0.021242145,-0.012484762,-0.026636913,-0.0084209265,-0.047864653,-0.0072591314,0.025711836,0.036251113,0.069573395,-0.018351888,-0.035279226,0.0113618765,0.031342894,-0.0031422174,0.066427685,0.027504,0.029728424,0.0039395746,-0.03269435,-0.0017691363,-0.053640675,0.016046204,0.009261211,0.021356752,0.030447472,0.031227056,0.027843434,-0.025550574,0.0055814167,0.022371713,0.023827963,0.0051830006,0.029199613,-0.014332554,-0.0011406534,-0.015017773,-0.029181091,0.01597946,-0.0048846197,-0.012474265,0.0056967116,-0.03210799,0.0109988805,-0.05572174,0.008318674,-0.017558854,0.023708444,0.028598366,-0.013680062,0.02170377,0.064907104,0.017587943,0.060634147,0.0011576519,-0.004703838,0.0060949996,-0.006980756,-0.0066090715,-0.035635572,-0.0057415166,0.017231608,0.019283617,-0.027401598,-0.003673808,-0.30295125,-0.0035791106,-0.01941344,-0.05911675,-0.071975395,0.025772363,0.056865457,0.07742757,0.023695339,-0.001524145,0.0108439075,-0.014865172,-0.0077212933,-0.009262314,-0.0054699313,0.039491426,-0.011796627,-0.031569656,0.041499406,-0.008065023,0.04975737,0.013269311,-0.031336606,-0.010399488,-0.003600824,-0.024184551,-0.013269848,0.013330063,-0.044794794,-0.05681853,-0.018586652,0.036852032,-0.00049266923,0.0142951775,0.004441319,0.028102195,0.02674166,0.026574848,0.037245963,0.04013677,-0.0034434537,-0.037926782,0.024838004,0.0050950963,-0.011821641,0.0043789446,0.028723693,0.0016230728,0.03064228,-0.016307399,-0.018211583,-0.011375007,-0.012790974,-0.028948518,-0.0352246,-0.008414397,0.019486962,-0.024334468,-0.0034992837,0.013393481,0.029271407,-0.019927628,-0.010423183,0.02331584,0.017572554,0.023460738,0.0027215276,0.03006506,0.017237622,0.033021186,-0.018927401,-0.027953824,0.008482469,-0.0019067754,-0.009819366,0.03778823,-0.020106753,-0.0046079494,0.024765646,0.022616949,0.0009754108,-0.019857088,0.029118745,0.03312818,0.018015936,-0.023877395,-0.029948846,0.00500853,0.022930244,0.012360683,0.00043483468,0.074302144,-0.025342882,0.027177995,-0.001694478,0.025487658,0.032279544,0.005624941,-0.039951954,0.02226483,-0.048962213,-0.032350242,-0.031691898,-0.025718575,-0.007871002,0.041477956,0.020476326,-0.018150385,-0.000803509,0.0029620621,-0.016962992,0.014980994,-0.044298,0.0218159,-0.036716424,0.03774915,0.005140224,0.0066156667,-0.040553853,-0.027104435,-0.012932899,-0.005182154,-0.046961024,-0.0056242575,-0.022908933,0.023840059,-0.0002708952,0.013595824,-0.0026373852,0.018527362,0.03619645,-0.036601048,-0.04075559,0.0508901,0.01669189,0.035962973,0.012290111,-0.028265068,-0.020780802,-0.0039401567,-0.007280027,0.025751056,-0.043031257,0.021848893,0.020399675,0.019128507,0.02698801,-0.027986536,-0.046144217,0.027752202,-0.018123178,-0.033018675,0.028666114,-0.0005417394,-0.010149478,-0.02112534,-0.063431084,0.05914117,-0.0016883425,0.010409803,0.014774574,-0.006373429,-0.019017527,0.02357431,0.040849872,-0.0011563307,0.02778759,0.006006944,-0.014086478,0.021135258,-0.020459417,-0.014603365,0.0120097045,-0.022465827,0.04358608,-0.029185455,0.010446627,-0.007340458,-0.002312229,0.05925426,0.022866933,0.009163955,0.030265022,-0.016584087,0.027046997,0.01803314,0.0076919007,-0.011207245,0.012535543,-0.0077385833,0.0095832525,0.030871011,0.0061852075,0.0184858,0.008915017,0.0014575125,-0.021376995,-0.023062246,-0.020614702,-0.044856954,-0.01105065,-0.019582696,-0.0012460221,-0.004041955,-0.025804743,-0.058043897,0.0155949835,0.013414263,-0.19390161,0.046127617,0.008369254,0.0075070634,-0.053493645,0.018629171,0.011710018,-0.024879018,-0.01014782,-0.026624225,-0.053944554,-0.0045020846,0.032772984,0.001156493,0.03639215,-0.04637243,-0.020076398,-0.018389586,0.011297341,0.007431326,-0.027474234,0.021060444,-0.33456865,-0.015673982,0.014465938,0.028843505,0.006653721,-0.0086296415,0.005060975,0.003971452,0.025211608,0.0056609996,0.013545905,0.013790855,0.020502413,-0.04978765,0.026878536,0.03775951,-0.019873898,-0.008522087,-0.025936455,-0.025655294,0.003407877,0.040143233,-0.052355208,-0.020510685,0.0060066436,-0.00451358,0.052027818,0.034471538,0.013197273,0.06432937,0.004811726,0.030555747,0.031934753,-0.006393615,-0.015282096,0.013924737,0.019884255,-0.010020396,0.022492696,0.037945468,-0.054884646,0.042635735,0.064782694,0.054377038,0.046003137,-0.040255565,0.0010446352,0.021587389,-0.022421794,0.0015906753,0.05599201,-0.0546729,-0.046370465,0.051395286,-0.039943196,-0.01818351,-0.033102646,-0.002763688,-0.03677955,-0.009782946,-0.0029018405,-0.0010451339,-0.024348475,0.00024196263,0.0121120615,0.03184195,-0.036177818,-0.014153292,-0.018080471,-0.0320147,-0.04756547,0.014116528,-0.004002975,0.003781761,0.031502042,-0.015616016,0.024470381,0.003346945,-0.0028580541,-0.020275919,0.009102515,-0.021405615,-0.03335119,0.006337166,-0.03739135,-0.006072875,-0.021288104,0.037395027,0.0019601153,-0.03578937,-0.05187323,0.015467211,0.0008212949,0.011742404,-0.002978519,0.04112604,-0.044854123,-0.0042481367,0.02504103,0.0055447784,-0.021582082,0.04573013,-0.042721454,0.023623032,-0.0020911596,-0.0101048425,-0.008845995,-0.07404157,0.025225114,0.04262055,0.01384034,0.005458861,0.0063980273,0.022343516,-0.049505204,-0.0067402264,-0.037227374,-0.01460691,-0.026544828,-0.0008856941,-0.014228277,-0.0011639473,-0.004330623,0.04168712,-0.0036432496,-0.009322115,-0.018392302,0.012600558,-0.02441829,-0.028902829,0.012388702,0.046823483,0.010681416,0.030421497,-0.0072112517,0.007944939,0.00030298493,0.012876278,0.002957851,-0.03964253,-0.015157492,-0.02953779,0.016758934,0.037165977,-0.033323247,-0.022225235,0.027030256,0.059152998,0.040070124,0.03903636,0.033089943,-0.024385,0.046467576,0.018178832,-0.012209194,0.023330145,-0.0127511015,-0.013050118,-0.027345126,0.06616335,-0.0016121777,-0.023289802,0.02760121,-0.020826414,0.008725955,0.0004363261,-0.28660777,-0.01862025,-0.01672907,-0.0047938763,0.012411696,-0.021626102,-0.028028892,0.021133527,0.011611792,-0.007957659,0.04362082,-0.0015094631,-0.045166552,0.019991562,0.021494653,-0.006810119,-0.0004981775,-0.03018568,-0.030170433,-0.019655835,-0.035385776,-0.014865347,-0.048118785,-0.00577669,0.040380236,-0.0373282,0.034973823,0.0056385454,0.020504886,0.02401753,0.0041195727,0.032621272,0.0012467289,0.015403861,-0.0031283628,0.0007139756,0.03694801,-0.009792614,0.016398473,-0.025013821,-0.0031565563,0.018222362,0.003632196,-0.022442747,0.016978053,-0.023115221,-0.001046745,-0.12612987,0.020471117,-0.014556754,0.015045079,0.07790146,0.0043752813,0.03136956,0.005625252,0.07456209,0.0015142469,-0.012157231,-0.030575493,-0.058452442,-0.0031624103,-0.036738228,0.023475599,-0.018080877,0.08095662,-0.0057042777,-0.002328332,0.15606809,-0.027396513,0.010822354,-0.0026491177,0.02830455,0.0072387094,0.0053679007,-0.021553602,-0.020757822,-0.00077522127,0.0280883,0.028443344,0.03452271,-0.01934466,0.042991,0.013474656,-0.0096798595,-0.019230146,0.10811306,0.017290102,-0.015476214,-0.018378124,0.003897256,0.024785504,-0.0101180645,0.053818803,-0.016451491,-0.008939349,0.00959389,0.030831214,-0.01788658,0.0087451115,0.042271093,-0.062341142,0.029857561,0.0043978333,0.007875141,-0.0052403836,-0.021121537,0.0006906916,0.011761858,0.012201826,0.032539368,-0.03240939,0.0089735715,0.022955664,-0.006739724,0.016832298,0.0075019705,-0.004686632,0.03434717,-0.00074903213,-0.027892271,-0.021797113,-0.011280546,-0.029651945,0.030008228,-0.0035812764,-0.0150690675,0.015011038,-0.004122929,-0.026870484,0.040194333,-0.03278802,0.003677871,0.004094086,-0.011173139,-0.010559166,-0.024733216,0.025815224,0.01643656,0.003964418,-0.041082628,0.002385088,0.013350049,-0.02433887,-0.0080306325,0.0052432674,-0.00093597657,0.008259179,0.008158246,-0.020603284,-0.033131693,0.010170439,-0.01849559,-0.020292768,-0.03540622,0.041292585,-0.058562826,-0.0012843964,0.023215873,-0.050432518,-0.011893771,0.014090806,0.0059267622,0.008334067,-0.032798316,-0.0120199695,-0.05499519,-0.01634145,0.009284387,-0.012862901,-0.0039411047,-0.020371383,-0.018365016,-0.024175715,0.008591053,0.055579558,0.042569015,-0.005531653,0.0028802103,-0.015349525,0.01307318,-0.014075312,-0.004697034,-0.030447083,-0.015942099,0.03248094,-0.0033759773,-0.0073233726,0.013945432,-0.0026887825,-0.0011025013,-0.04718651,-0.019403437,-0.023906633,0.053080175,0.009543167,-0.02505007,0.027537648,0.042649616,0.005762621,-0.01425729,-0.03705792,0.01812336,0.005734684,-0.013178901,-0.056697376,0.013730009,-0.03327776,-0.0155890845,-0.030356994,0.024664557,0.021421585,0.03240145,0.0346479,0.031841256,-0.026821556,0.013529583,0.04187326,-0.011632826,0.037753265,-0.050725445,-0.0077499156,0.019824296,-0.010591164,-0.029693292,-0.005488655,0.095550984,-0.001147848,0.019656327,-0.0631739,-0.00064024323,-0.05572961,-0.0027347011,0.018000757,-0.00874142,-0.025065383,0.022970438,-0.03348079,0.002705021,0.04294587,0.012130154,0.01940938,0.014183264,0.025344968,-0.0077663483,-0.007931738,-0.036673196,-0.0018199232,0.042258184,0.024736809,-0.0069773872,-0.05595176,0.018856786,0.009103961,-0.0126506565,-0.013437004,-0.021304928,-0.025542442,-0.015084928,-0.015942127,0.046476036,0.025583811]	2026-09-08 09:32:54.310023+00
26	teachers	4	0	Toshmatov Sardor Ulugbekovich	O'qituvchi profili\n\nToshmatov Sardor Ulugbekovich — maktab o'qituvchisi. Fanlar: Fizika. Ish tajribasi: 9 yil. Ma'lumoti: Nukus davlat pedagogika instituti. Fizika va astronomiya o'qituvchisi, maktab ilmiy to'garagi rahbari.	/teachers/4	c18713c97c9ad9dfaa0651463effca0001c26b228f5e810805859e1e76250b48	[0.019237118,0.017027287,0.024931401,0.018233564,-0.031676415,0.009477052,0.0150061585,0.007693361,0.0059111,-0.10532892,-0.03902439,0.039628286,0.007893568,-0.019385837,-0.050773934,-0.0066422783,0.019914478,0.013390213,-0.022144882,-0.029156497,0.0155300675,-0.02211416,-0.010946245,0.005844474,-0.0049949475,0.006290413,0.047478616,-0.0071800086,-0.02591394,0.21868537,-0.026607122,-0.028910464,0.0039043278,0.001562185,-0.011659849,0.0072688386,-0.019515911,-0.016944319,-0.019109115,0.011912647,-0.00013073186,-0.0007331876,-0.043128323,-0.013922164,-0.006091758,-0.025699994,-0.021679938,0.013016166,0.011986812,-0.010631232,0.017501393,-0.02956414,0.034217328,0.0144255925,0.023774358,0.012972601,0.0066718743,-0.025982844,0.030287998,0.01028808,0.012164847,0.034370806,-0.0028517775,-0.025491001,0.026174648,-0.032700125,0.032919988,-0.016518088,-0.008658003,0.011690879,-0.03903175,0.017566904,-0.006143185,0.040798582,-0.027213233,-0.00701251,0.015580709,-0.0018653118,-0.0077472273,0.066049315,-0.012215826,0.01914638,-0.036910653,0.017382761,0.03640912,-0.00062013336,-0.028819507,0.028345412,-0.05828716,0.07946305,-0.019991517,0.011825262,-0.025054948,0.0033314286,-0.0053179483,-0.013512632,-0.012317616,0.023721475,-0.0022643672,0.0012403852,0.00029913607,0.028542394,0.034017205,-0.0006603672,-0.005386945,-0.07434994,0.01673308,-0.016255455,0.020398175,-0.0031523095,0.027683873,-0.29062113,0.008797076,0.0115587395,-0.0868313,-0.058057506,-0.02215916,0.017314568,0.056946237,0.024720833,0.017679764,0.044773396,0.017015379,0.024432385,-0.009657708,0.043466944,0.026168887,0.0060731904,-0.026179558,0.011243047,-0.025262792,0.040889557,0.008476076,-0.056599468,-0.00011929345,0.032373443,-0.036864895,0.026674427,0.029755453,-0.030473692,-0.0020611272,-0.046419866,0.019885484,-0.013164504,-0.0051911836,-0.028830508,0.02690083,-0.017107736,0.029874152,0.034402117,-0.04335254,0.0003313117,-0.0064053372,0.037897166,-0.03128372,0.010103332,-0.009840082,0.01924336,0.013945584,0.060925376,0.0058307573,0.010417455,-0.012333726,0.02034413,-0.0042100335,-0.0146685885,-0.049681414,0.050932113,-0.031107824,-0.03352183,0.006749275,0.01422292,0.003641461,0.026000483,-0.0022365781,0.027279675,0.022437813,-0.004309342,0.04998776,0.047069754,0.0160012,-0.045675747,-0.038936686,-0.015343293,0.029730473,0.00011377605,0.025921617,-0.048803724,-0.023321994,0.03677916,0.026065495,0.024636718,-0.0059027392,-0.021819282,0.05552736,0.034074076,0.008851114,-0.04938388,-0.023008218,-0.0500366,-0.0022540276,-0.005781226,0.09050791,-0.02409201,0.008079962,0.0140186185,0.022288386,0.0023536694,-0.002498865,-0.031857833,0.009307873,-0.015079116,-0.025952568,-0.06792685,0.024511477,-0.022972038,0.004798954,0.021430971,-0.034663923,0.012881957,0.009505033,-0.015882248,0.027126893,-0.02433283,-0.016342973,-0.02749028,0.010074743,0.028306533,-0.0009469392,0.0014811816,-0.022225752,-0.0040734825,-0.029278219,0.0048063053,0.0053943233,-0.0031522142,0.044061843,0.016866295,0.042811386,-0.04164333,-0.010784861,0.009750932,-0.006160006,-0.008545456,0.03130997,0.0056968653,0.017273441,0.015852768,-0.024415212,-0.015666485,0.01744565,-0.041699894,0.012468072,-0.03797105,0.029053053,0.036861785,0.020128297,0.026051404,-0.01682243,-0.008519062,0.024121696,-0.044609934,-0.014058204,-0.008519189,0.019401513,0.022134569,0.019518118,-0.088176884,0.019364301,0.022322021,0.008848371,0.024867063,-0.0008007164,0.0070878295,0.0030521427,0.057398666,0.020046514,-0.008931741,-0.0055633592,0.00194038,0.030323802,-0.0035569717,-0.010935557,0.049919024,0.012427829,0.017229244,-0.06587886,0.004687258,-0.01608803,0.017180873,0.00089280814,0.020144066,0.023231862,-0.0036019299,0.008138919,0.007959745,0.013283588,-0.038353596,-0.0079433685,-0.0259186,0.0075719664,-0.008607772,-0.0046292343,-0.008563116,0.01800287,0.027171124,0.0076349955,-0.0062432145,-0.027215172,-0.026694272,-0.022778222,0.018036708,-0.027627489,-0.03119662,0.016497212,-0.005171462,-0.049295414,0.020891733,0.007137385,-0.19843408,0.017365078,0.019078614,-0.033386063,-0.057533327,0.011843974,0.005062509,-0.0142017035,-0.0073046223,9.943444e-05,-0.026131421,0.0010729374,0.047485873,-0.007082735,0.018509032,-0.06309586,0.0008409114,-0.0002039457,-0.0007254667,0.006188922,-0.019316819,-0.016926484,-0.32334813,-0.026509764,-0.002173172,0.039836626,0.0036388002,0.03257292,0.0144785065,-0.0037462697,0.04363494,-0.001726778,0.038899776,-0.019413281,0.0113507435,-0.0068300115,0.023084063,-0.008993122,-0.017208591,-0.028041312,0.02118344,-0.038338616,0.00025384844,0.019773362,-0.043302044,-0.023400895,-0.0059170495,-0.050272375,-0.0016591549,0.036102895,0.0065047336,-5.7766705e-05,0.020642672,0.026877336,-0.010982698,0.004899246,-0.009087436,0.0025134492,0.040520474,-0.015402703,0.010110047,0.0366604,-0.031893373,-0.005296398,-0.015172112,0.039294742,0.029608818,0.004381759,-0.03804726,0.029231435,-0.037797377,0.03861457,0.052451044,-0.046052467,-0.041780144,-0.01735637,-0.032268047,0.008775061,-0.05445907,0.025903255,-0.05351058,0.021443596,0.0027954197,-0.017936738,-0.014920771,-0.02865994,0.0072017936,0.07446658,-0.020138739,-0.018823482,-0.014756882,-0.054139234,-0.018110327,0.002744662,0.04364086,0.021999964,0.008466555,-0.026370697,0.045054466,-0.025530089,0.001081933,0.0225842,-0.011835575,0.021276455,-0.028336255,0.008449205,-0.025909757,0.035893433,-0.053193845,-0.0067890845,-0.0018415828,-0.03236963,-0.015974015,-0.027258432,0.0015948557,-0.0012582095,-0.032527883,0.0119533045,-0.054807026,0.011598716,0.017189182,-0.0066402587,0.014049914,0.058182467,-0.015929688,0.009552059,-0.0137742385,-0.014442167,0.048628837,-0.029340658,-0.009262262,0.059265304,0.016490905,-0.010466227,0.026704643,0.036183495,-0.011112998,-0.017664867,-0.013254944,-0.01650273,0.003842956,0.006519056,0.010970233,0.035071116,0.012805747,-0.004599195,-0.02668414,-0.01291462,0.0067390343,0.020766536,0.007945845,-0.061339565,0.011911769,0.057028946,-0.021554338,-0.0056348885,0.008981413,0.014443383,0.015001816,0.019409858,0.02915257,0.031896096,0.031915944,-0.004617296,0.042860944,0.014850565,-0.05072529,-0.010183481,-0.013647673,0.043661594,0.0043407837,0.014434988,0.032814108,-0.055870846,-0.008887376,0.0072385045,-0.0013159801,0.01888491,0.002493889,0.0027831711,-0.09349806,0.03288858,0.012147595,-0.055435315,0.052046344,-0.0003801942,0.008545972,-0.013767037,-0.26939097,-0.0007123061,-0.038541302,0.017371682,0.006424786,-0.0046511595,0.016203184,-0.016996013,0.046991546,0.020883512,0.047006354,0.029907787,-0.049174856,0.039724484,0.008143499,0.010785219,-0.024127504,-0.026006866,0.0021038475,0.02095001,-0.0007516696,-0.06792464,-0.053638157,-0.04028104,0.026496468,-0.08132644,-0.010097409,0.0079233805,-0.020908326,0.060233407,-0.0123078,0.023026243,0.0075671123,0.013638666,0.018221976,-0.009645492,0.057549655,-0.037721112,-0.019396601,-0.04242373,0.031987045,0.06255288,-0.029478757,-0.0040956275,0.02519997,0.005481347,0.00575445,-0.11309454,-0.027010959,0.00633031,-0.044713125,0.01700065,0.00044022297,-0.006143971,-0.03847939,0.010798893,-0.02146207,-0.029606331,-0.057739444,-0.035501923,-0.030597443,-0.059335917,0.03520697,0.0033883161,0.057747666,-0.011886775,-0.020940168,0.15242188,-0.03645266,-0.018386368,-0.02648991,0.024282394,-0.016393885,0.008487315,-0.0017021862,0.029201144,0.0018966373,0.0024011226,-0.004830667,0.029499736,-0.0030548072,-0.003227948,0.008305358,0.024212848,-0.0067317053,0.08437495,0.029993638,0.03991531,-0.011702569,0.037352987,0.0039767306,0.04466672,-0.0009282925,0.019343885,0.0032820716,0.025639726,0.020990927,-0.03562138,-0.04325658,0.020464893,-0.07139042,0.033909783,0.029385353,0.0035460358,0.021632066,-0.001166773,0.028686661,-0.002014609,0.019504145,0.016636515,-0.0022527098,0.039596394,0.049029134,-0.029231435,-0.019044008,-0.002261491,0.0017926279,0.037798297,-0.023450991,-0.015715932,-0.028518274,-0.0051452466,0.055571336,-0.019136902,-0.059095807,0.029162329,0.018925497,-0.03378899,-0.04472238,0.047222674,-0.0018402191,0.028654631,0.026403295,-0.023113431,0.030290768,-0.02330464,0.01936221,0.03469967,0.012649991,0.003601924,-0.029517151,-0.024222344,-0.014271006,0.015114695,0.010812023,-0.013841469,-0.019631494,0.019979933,0.038895708,3.638883e-05,-0.046005197,-0.0024343394,-0.023704786,-0.03095341,0.006570524,-0.011950477,-0.017699352,0.009000786,0.007931859,-0.004308909,0.019418765,0.005635285,0.013228436,0.0018918723,-0.05870216,-0.03243009,-0.0046234285,-0.002301715,0.047890447,-0.013355592,0.02408536,0.013701438,-0.034543227,0.013004035,0.018881273,0.015468579,-0.015144994,0.050929226,-0.023955686,-0.011156913,-0.019151775,0.003678944,-0.00091443124,-0.029375952,0.049744464,0.0069395206,-0.012144989,0.03583511,-0.03379796,-0.0067693545,0.030264316,0.014822662,-0.018506207,0.066047,-0.0040034093,-0.013691771,-0.024508724,0.037478857,0.012835513,0.014437267,-0.067209594,-0.027050378,0.030827155,-0.045432232,-0.07719038,0.019090332,-0.008209871,-0.010918819,-0.018311603,0.022577384,0.027978975,0.043694023,-0.011420437,0.020404747,-0.03154871,0.03601694,0.008840566,0.0069224816,0.020942183,-0.04447653,-0.017699983,-0.012125329,-0.006150615,-0.016362578,-0.0011513958,0.08798709,0.014108105,-0.02615812,-0.053307083,0.032266602,-0.022191191,0.028479658,0.006421334,-0.005904907,-0.045507412,0.008104262,-0.009205065,0.025427638,-0.0039006402,0.015103621,0.0089308005,0.018420305,0.013154532,0.02685322,-0.004075814,0.021840012,-0.033738635,0.0339171,0.0032208234,0.0037123596,-0.024630278,0.0013473082,-0.053602826,-0.03466079,-0.08460656,-0.02958765,-0.017111594,0.0008930277,0.012367819,-0.00048686692,0.014790748]	2026-09-08 09:32:54.310023+00
27	teachers	2	0	Aliyev Aziz Baxtiyorovich	O'qituvchi profili\n\nAliyev Aziz Baxtiyorovich — maktab o'qituvchisi. Fanlar: Matematika. Ish tajribasi: 18 yil. Ma'lumoti: Toshkent davlat pedagogika universiteti, matematika fakulteti. Oliy toifali matematika o'qituvchisi. O'quvchilari har yili olimpiadalarda yuqori natijalarga erishadi.	/teachers/2	86f56b3531283fb8a9e60f2b5dd6929b040e73126f9280ee50e4491e08c9d6cd	[-0.0042209704,0.008708061,0.0102470275,0.0107078245,-0.009119934,0.008721536,-0.021165201,-0.00022586845,-0.0001484079,-0.07501911,-0.019573757,0.034095913,0.00017124595,-0.023686187,-0.01952076,0.02048208,-0.00831458,-0.013214331,-0.006327894,-0.022690035,0.00021211815,-0.0063021258,0.003114749,-0.00253521,-0.004195011,0.020412328,0.04599917,0.0038443552,-0.006808288,0.21428381,-0.009125652,-0.03477838,0.022732424,0.001917321,0.011800366,-0.0054931566,-0.019947913,-0.03765099,-0.014300468,0.040484004,0.006159353,0.035670023,-0.03271996,0.0009072934,-0.0011594398,-0.021047309,-0.021942226,-0.014411157,0.0032512073,-0.045436654,0.040953554,-0.059838932,0.004695947,0.034175802,-0.024251042,0.02427568,-0.0064104213,-0.0069447546,-0.0027871423,0.004167192,-0.014033229,0.03455097,0.027451066,0.0012139187,0.03466911,-0.010651062,0.018930998,-0.025102807,-0.0072994097,0.025085717,0.021161104,0.035832014,0.0005002574,-0.011012566,-0.01934305,0.005568527,-0.01301196,0.019824483,-0.02862495,0.050273754,0.002173851,0.012236063,-0.030404866,0.003066329,0.047342427,-0.018838044,-0.038164504,0.022425931,-0.038746554,0.08450705,-0.017399047,-0.01130977,0.0064119953,0.014342107,-0.012671452,0.0012231789,-0.03825566,0.0382486,0.010474779,0.012008364,0.0071301465,0.016015595,0.045232724,-0.009998964,-0.005426079,-0.058255475,-0.008258267,-0.0050104507,0.057081226,-0.0009957541,0.007151608,-0.2777841,0.0076983636,0.010667059,-0.09749779,-0.061145622,-0.023557235,0.020051837,0.053236693,0.0069868024,0.00094929663,0.035624035,0.013443181,0.0058112144,-0.029046725,0.03126448,0.0437013,0.021286871,-0.027501212,-0.0028271694,-0.0172439,0.047710195,0.016382843,-0.03097805,-0.036358852,0.017811516,-0.033418037,0.009706364,0.03884913,-0.020858213,-0.014604504,-0.067930974,0.0010360222,0.02019974,-0.020389726,0.0037051286,-0.010600209,-0.0063998103,0.021534128,0.048748236,-0.038214542,0.020541444,0.0071110437,0.0023044208,-0.0012121819,-0.011561067,-0.010501473,0.041947972,0.0011395348,0.03025681,-0.046587188,0.03353024,-0.040903755,0.043253213,-0.012925905,-0.015746213,-0.025737287,0.02268271,-0.030809643,-0.0046801833,-0.01916037,0.0055115772,0.016346307,0.02203316,0.03228013,0.004118402,0.027293226,-0.002565475,0.08769008,0.06312136,0.032383833,-0.014524058,-0.044854034,0.023394138,-0.0016568495,0.005542382,0.008477038,-0.00943139,-0.019427482,0.0148578985,-0.018072544,0.0020193637,-0.0013630019,-0.007057887,0.02123424,0.038986653,0.026215358,-0.053907912,-0.050747577,-0.0005682611,-0.009564089,-0.024039345,0.078743614,-0.04311496,0.016288996,-0.021711623,0.043721616,-0.014251937,0.026701286,-0.04180505,0.023145178,-0.020839114,-0.019496463,-0.048392925,0.018756451,-0.028034838,-0.015510611,0.01333155,-0.008162045,0.00904944,0.0077947094,-0.011835485,0.02862288,-0.05118088,0.0050327578,-0.009738994,0.016064482,0.013157619,0.0043010977,0.03905289,-0.024559971,-0.027999705,-0.015244307,0.0015823464,-0.009153496,0.0040831272,0.026436448,0.031162236,0.033126403,-0.020159947,0.024561403,-0.0030059523,0.008083883,-0.018428165,0.01902657,0.03195883,0.034140266,0.025074543,-0.00031040117,-0.021654326,-0.00641499,-0.015440188,0.021532366,-0.023968685,-0.0053871586,0.01955221,0.00809079,0.018782513,0.014767138,-0.011318251,0.02023485,-0.020238334,-0.023643779,0.004225826,0.030786386,0.0013629491,-0.01893173,-0.08819381,0.02238388,0.00578893,0.0010841511,0.030605584,0.02566079,0.0012546821,0.0166335,0.05987379,0.024547383,0.016333187,-0.015706142,-0.01946544,0.01874729,-0.009130591,-0.011719522,0.065148145,0.004978765,-0.008670424,-0.054823928,-0.017980441,-0.015264079,0.046005648,0.031144967,0.04049971,-0.0103168,0.013522613,0.003363474,0.03126508,0.025371065,-0.020440606,-0.015175932,-0.011651126,-0.020579794,0.015206668,-0.0029680713,-0.029293068,-0.002466547,0.041270625,0.032099847,-0.0070701437,-0.0142430235,-0.0420228,-0.018241812,0.0037689393,-0.033184174,-0.015812531,-0.033488818,0.024991732,-0.026249195,0.0031047012,0.007983242,-0.17599803,0.03216322,-0.0033385355,0.0035350374,-0.039153263,0.0439155,-0.00592668,-0.04030943,-0.017900078,0.0067902794,-0.05680201,0.02153593,0.04571422,0.0037910906,0.019118072,-0.054473076,0.009016966,-0.0053234296,0.041314963,-0.0016802987,-0.02523904,-0.0014200977,-0.34785342,-0.012640628,0.01524638,0.05989631,-0.0005182983,0.023242801,0.001985391,-0.014059107,0.027055947,0.003207047,0.02321288,-0.010043632,0.04111252,-0.035981867,0.018186124,-0.010194444,-0.0104565555,-0.039914735,-0.010609452,-0.01612733,-0.007696317,0.0297655,-0.013020726,-0.039476942,-0.03618545,-0.018341403,0.016546104,0.042486355,-0.008806994,0.041572113,0.07011291,0.043567024,0.0031715918,-0.023445994,-0.026669607,-0.020841973,0.050406646,-0.03643166,-0.013062833,0.047123488,-0.07174104,0.021835167,0.0068314276,0.04793555,0.010892504,-0.023531202,-0.042163152,0.023572255,-0.017858043,0.04192416,0.051147416,-0.043946274,0.008937786,-0.0010523245,-0.037371453,0.02160325,-0.0432369,0.0068176244,-0.025028715,0.03429548,0.0072665913,-0.013356838,-0.01794545,0.00017026594,-0.0037060652,0.052559827,0.0004260463,0.002966913,-0.016880795,-0.052942768,-0.018486917,0.018608583,0.017519895,-0.013917703,0.024661329,-0.074310325,0.04003482,0.0066418676,-0.005274843,-0.0006354011,0.009218428,-0.0147637455,-0.035590533,0.000103360646,-0.035115007,0.026727257,-0.023863195,-0.009052601,-0.0063450667,-0.04253049,-0.011390269,-0.0022159878,0.018722767,0.010103435,-0.042932406,0.030811159,-0.051671833,0.030242054,0.03324311,-0.0011093686,-0.014535908,0.07491129,-0.06412714,0.039370295,0.00633075,-0.019078497,0.047769144,-0.05084738,0.014723356,0.051747136,-0.00091600994,-0.002569541,0.005495441,0.022556959,-0.022785716,-0.0017979207,-0.0382849,0.008783388,-0.008632478,0.005474526,-0.03077621,0.006306085,0.040272377,-0.0031316446,-0.017680338,-0.021337155,-0.019222049,0.029084126,0.02074502,-0.040498924,-0.00048040136,0.034643244,0.012830429,-0.010874227,-0.013124981,0.0031747008,0.028621513,-0.00068961614,0.036356796,0.015128751,0.022714417,0.005659424,0.05547901,0.007375493,-0.05637086,0.03885799,-0.02329057,0.02991922,-0.00968615,0.0014051568,0.03831114,-0.051902674,-0.008513359,0.018288782,-0.00032011638,-0.021198831,-0.0016114626,0.0020881898,-0.074778534,0.023684967,-0.019855281,-0.027902326,0.035965003,-0.015184992,0.018524757,-0.037621558,-0.2936579,-0.022767588,0.00247656,-0.0065557947,0.008116606,-0.022128085,-0.008040855,-0.016494883,0.025086608,0.009954605,0.022239061,0.052405123,-0.03917397,0.018234102,0.034451336,0.022765085,-0.008745764,-0.027833853,-0.0369523,0.025671223,-0.015265983,-0.03162796,-0.030985743,-0.018470418,0.016855711,-0.021273138,0.046808366,0.0011378202,0.0029513433,0.057966873,0.0071908785,0.00048956095,0.0030719985,-0.023807349,0.0051322756,-0.01867846,0.03659186,-0.043444782,0.021277932,-0.040766798,0.03385661,0.04636835,-0.039681878,-0.025016416,0.015706772,0.0052905655,0.042242896,-0.13910773,-0.01943215,0.023094442,-0.02267682,0.031889327,0.017901257,0.035567004,-0.019614536,0.05581082,-0.046406996,-0.01942317,-0.055712022,-0.07452576,0.0017972918,-0.061873917,0.04525787,0.003538193,0.031002803,-0.011837827,-0.0006048346,0.16876067,0.0006220745,-0.0040206183,-0.038562313,0.012987859,-0.0070998874,0.027111972,-0.014697069,0.021200715,-0.030356346,0.0076379604,0.013286137,0.012911599,-0.0056398315,0.022511723,0.01374469,-0.0099091455,0.0059977495,0.041471772,0.009250841,0.032468174,-0.03321034,0.027199961,0.02175559,0.037617464,0.019356702,-0.015023891,0.023468608,0.031167315,0.008170792,-0.006458165,-0.024373168,0.031726405,-0.05449666,0.020478943,0.025441194,-0.0032803898,0.011631837,-0.015950702,-0.003825413,0.0020731208,0.044368193,0.052135784,-0.029364506,0.04198591,0.06524891,-0.02699774,-0.0038191348,-0.0029759614,0.029307244,0.029661404,-0.012525237,0.0017398038,-0.016884042,-0.037427858,-0.0127780745,0.0030079926,-0.046113797,0.03507495,0.012965761,0.01265161,-0.05113262,0.06002704,-0.0208665,-0.010278924,0.018385962,0.01989687,0.048521075,-0.018075656,-0.015731497,0.022317534,0.025393618,-0.041539386,-0.018724414,-0.011939435,0.005719328,0.0069091045,0.01491902,-0.002311946,-0.02546379,0.014936928,0.03132961,-0.00823199,-0.016884705,-0.018554738,-0.010287509,-0.00175453,0.04184816,-0.017177962,-0.008023449,0.028791005,-0.036997646,-0.014907164,0.008366265,-0.003685977,-0.004255704,0.009455997,-0.015398272,-0.018386465,-0.003032161,0.012901273,0.024016758,0.015161246,0.009630219,-0.0037472143,-0.00907002,0.011714787,0.032214858,0.0491908,-0.01623621,0.0023129478,0.0075736744,0.004248025,-0.031191649,0.0058252355,0.0007570729,-0.014627345,0.010617604,0.018467503,-0.028034138,0.017919179,-0.013830237,0.034513567,-0.0028663413,0.034475617,0.0010595995,0.058439035,0.00246917,-0.0070294207,-0.023332607,0.01497038,-0.00090303464,0.0072078756,-0.09605385,0.018607913,-0.01058987,-0.037995283,-0.05409472,0.045201052,-0.0138055375,-0.020919891,-0.015907722,0.027661268,0.071858026,0.0135406805,-0.008467721,0.021695958,-0.0068934863,0.062280744,0.021093706,-0.0032151274,-0.018831113,-0.003352862,0.0065581175,-0.008634399,-0.03218898,-0.017424894,0.010059532,0.079670794,0.021591527,0.02254102,-0.033359066,-0.011224443,-0.007813728,0.026386231,0.009456179,0.017581271,-0.047127258,0.029112281,-0.009488347,0.026443223,-0.0026972443,0.007964338,0.0005054997,0.014670612,0.016679563,0.0074761757,0.024216574,0.0194576,-0.034565073,0.037737202,-0.004122962,0.020763626,-0.029516898,0.008925206,-0.021115659,-0.02563421,-0.01861687,0.013139711,-0.05029123,-0.02252456,-0.02010447,0.012779631,0.0026620326]	2026-09-08 09:32:54.310023+00
28	teachers	3	0	Rahimova Dilnoza Erkinovna	O'qituvchi profili\n\nRahimova Dilnoza Erkinovna — maktab o'qituvchisi. Fanlar: Ingliz tili. Ish tajribasi: 12 yil. Ma'lumoti: O'zbekiston davlat jahon tillari universiteti. IELTS 8.0 sertifikati egasi. Xalqaro almashuv dasturlari koordinatori.	/teachers/3	50da0536013ea9ee462cc2b2a187bfada42c41e1635ea7eabc87182b2e39a51b	[0.031785198,0.008680516,0.0071758106,0.023921506,-0.0035265211,-0.0165616,-0.006184951,0.010487872,-4.3850603e-05,-0.09269151,-0.03356939,0.04638302,-0.006785325,0.0015166136,-0.017748823,4.563614e-05,-0.005315755,0.009304888,-0.07724805,-0.03758932,-0.0031543744,-0.0043709804,0.021769837,0.057037454,-0.005100804,-0.013649599,0.026045874,-0.0010220481,-0.041886248,0.23377547,-0.044197768,-0.002778023,-0.003520827,-0.014692324,0.009027357,-0.0007181692,0.0033668927,-0.017500278,-0.012985312,0.05281388,-0.023627656,-0.009879998,-0.042236064,0.011023869,-0.023060454,-0.037656333,-0.020128747,0.023782024,-0.005842574,-0.032919455,0.029508468,-0.04358557,0.010028534,-0.017473025,0.014941669,0.021658102,0.005516263,-0.029101096,0.032195903,0.02249097,-0.020984212,0.044740114,0.024744293,-0.002969861,0.035543535,-0.019453652,0.0019171762,-0.010433404,0.027840061,0.02844159,0.034747668,0.0141151715,0.0018982573,0.06606894,-0.0116929645,-0.017674165,-0.010574529,-0.005403616,-0.008495826,0.009810571,0.02490551,-0.0062162345,-0.05291605,-0.02478453,0.05236122,-0.015104541,-0.042521775,0.04052948,-0.044349294,0.0703687,-0.04115625,0.017817203,0.0010685045,0.009683198,-0.028180264,-0.008641736,0.013663828,0.023568733,0.009739388,0.04048238,0.021390518,-0.010838038,0.025039705,0.0043707998,0.026509691,-0.029998545,-0.014401019,-0.0077457638,0.048884,0.012311618,-0.0037541732,-0.29329565,0.03949695,-0.0035262927,-0.070032805,-0.070284955,0.011852456,0.053411942,0.06990034,0.010723382,0.009871318,0.033368956,-0.00024732278,0.009249026,0.004431914,0.03745164,0.02626599,0.03048488,-0.027135517,0.007223406,-0.012779056,0.071974345,-0.025832543,-0.0498655,-0.01590309,0.0038772079,-0.031335257,0.031121505,0.038127426,-0.015446863,0.016671574,-0.046612307,-0.0051261084,0.008431922,-0.012594982,-0.014296289,0.0012044477,-0.032581393,0.027795913,0.027060824,0.01417439,0.0021900353,-0.01383617,0.023675242,-0.008792167,0.004407984,-0.017630627,0.01895398,-0.018429665,0.056793556,-0.00092255673,0.013603412,-0.05770996,0.019693285,-0.027695209,-0.02607927,0.009111678,0.03400553,-0.048373915,-0.011635483,0.013894419,0.016574003,-0.01803081,0.017850768,-0.0031801967,-0.0066142157,0.012954007,-0.00757712,0.044152435,0.04778434,0.02316063,0.010428183,-0.04217383,0.025036007,0.0409857,-0.019240709,0.012756551,-0.029937737,0.0039359764,0.043366924,0.03332152,0.0057124393,-0.04644198,-0.007965585,0.007418018,0.0048669437,0.020287437,-0.023211919,-0.028919805,-0.034089494,0.004815033,-0.007529978,0.07428314,-0.0320288,0.036090046,0.0020172412,-0.0016313315,-0.011323565,-0.0039668726,-0.06226554,0.0071420087,-0.032026447,-0.068608634,-0.021216534,0.004176947,-0.008072882,0.034055848,0.015540893,-0.005476798,-0.0030774595,0.031665713,-0.021308068,0.007221582,-0.018049616,0.0031448954,0.012282356,-0.003417204,0.009167338,0.020849384,0.005481062,-0.063658714,-0.0049539898,-0.019223256,-0.01253104,-0.0047624707,-0.047623396,0.012848298,-0.0050287624,0.030831508,-0.016008234,0.019730618,0.028779196,-0.023743534,-0.027175138,0.04118697,0.031421244,0.05004732,0.010718262,-0.016217643,-0.021976022,0.013283169,-0.013500732,0.02801236,-0.029347215,-0.010256714,-0.0004352883,0.03097116,0.025099289,0.00384799,-0.004151658,0.020817762,-0.052993722,-0.042617008,-0.011059303,0.0043232893,0.0020540142,-0.0010888021,-0.061959524,0.013123479,0.021582648,-0.021704208,0.0075289067,0.024367549,0.014798173,0.020064048,0.06798823,0.010036266,-0.006281023,0.003585914,0.004026545,0.025225922,0.004531178,-0.0022974305,0.036522415,0.015628608,-0.013141672,-0.030287398,0.0066009746,0.009768157,0.02556107,0.025699237,0.01560482,0.030805523,0.0061046192,-0.005363197,0.027758637,0.008289496,-0.0028611089,-0.020036897,-0.0029311134,0.004564597,-0.0045606876,0.01559397,0.012136482,-0.008411253,0.01998233,0.007876993,-0.018578395,-0.013799267,-0.031145418,-0.03636638,-0.021912571,-0.053751614,-0.030727673,-0.022445915,0.015644157,-0.050387945,0.018605439,-0.01137045,-0.18943827,0.03511853,-0.019635322,-0.018513603,-0.05894498,0.009880225,-0.005691425,-0.023420637,-0.010266865,-0.006178785,-0.046501536,-0.0058219456,0.05593766,0.014859151,0.03546622,-0.07683094,0.0044280016,0.0006268199,0.026864838,0.0004094102,-0.020472573,0.0011707637,-0.34494275,-0.022613551,-0.017557153,0.036946937,-0.008942303,0.00034080743,-0.022685643,-0.007791568,0.038183294,0.008122296,0.012817736,0.016661936,0.015753124,-0.045309663,0.029420841,0.023514874,0.0041953404,-0.028124338,-0.02258104,-0.008517655,-0.007310413,0.022430621,-0.06255876,0.0076179467,-0.00615938,-0.011608967,0.05096613,0.036260013,0.007750607,0.035149816,0.02919515,0.024117766,0.0069046253,0.012881118,0.015484567,0.022757234,0.021262154,-0.024046743,-0.008711428,0.040028483,-0.056886334,0.046999767,0.025544051,0.036112178,0.014225961,-0.008536859,-0.02566374,0.0025240658,-0.003058206,-0.0027185152,0.046064008,-0.055936605,-0.046245903,-0.010244743,-0.032758337,-0.00014640593,-0.039965145,0.0014145029,-0.0386339,0.033923276,-0.005894077,-0.015322867,-0.032641944,-0.0014950079,-0.0035106437,0.05034024,-0.010481521,-0.024542911,-0.012270094,-0.04678598,-0.041865584,0.025271734,0.0031361347,0.008328315,0.024134226,-0.05488768,0.056484655,-0.0024793984,-0.00419465,0.0038871854,0.009719952,-0.056381144,-0.021412365,0.010329928,-0.005481624,0.0463344,-0.03762263,-0.016573437,-0.018466417,-0.050705254,-0.0012680975,0.02887169,-0.0011309984,0.010598247,-0.0060843984,0.046093334,-0.04998538,0.013562966,0.0061206566,0.015715133,-0.018115439,0.077507846,-0.017071603,0.019495547,0.014167592,0.009602419,0.037681933,-0.052321598,0.022920499,0.033911772,-0.0040755305,0.013989483,-0.014993567,0.040187232,-0.024282657,-0.03455211,-0.030543854,-0.026486257,-0.038711123,0.0016629607,-0.02217644,-0.0058931494,0.03455175,0.0061282804,-0.028755667,-0.0097959945,-1.933977e-05,0.02748236,0.005843771,-0.045347296,0.017371858,0.028001526,-0.00065212714,0.007461439,-0.001729932,0.0123076765,0.030263705,0.022226252,0.04480589,-0.007564717,0.019220365,0.0048836935,0.014257012,0.022794342,-0.02217712,0.020503372,0.021012828,0.0048733046,0.019636305,0.0050395294,0.02651487,-0.038322255,0.003352574,0.020696165,-0.032861777,-0.0011016415,-0.016131537,0.031172225,-0.06122013,0.016875379,-0.0065838345,-0.056854412,0.061838444,-0.028709749,-0.0024021985,-0.01584729,-0.2759408,0.02150838,-0.016958699,0.021751856,-0.02542691,-0.012825224,-0.011674507,0.0128943715,0.046590082,-0.040607307,0.023065783,0.0026508,-0.059286974,0.027902886,0.017607529,0.007559997,-0.023781095,-0.013931011,-0.014734233,0.007361152,-0.039959323,-0.050648447,-0.0048181443,-0.04675704,0.041731562,-0.064296775,-0.01643988,0.0026333237,-0.0030513655,0.060353335,0.01420693,0.008305563,0.005867214,0.028363911,-0.030759012,-0.01404003,0.049274687,-0.032000136,0.004044038,-0.068425775,0.05193107,0.023245605,-0.020455878,-0.025649924,0.028689453,-0.0119514335,0.01800472,-0.116464555,0.005653882,-0.01030658,-0.00915314,0.059490032,0.012118778,0.020275569,-0.021933187,0.036582604,-0.0015363443,-0.04573956,-0.03897949,-0.04868329,0.0011580146,-0.05113084,0.04343224,-0.00057456887,0.0064427825,-0.014784596,-0.002899554,0.13684854,-0.02321494,0.010965286,-0.007331448,-0.0062916363,0.011681984,0.0054634423,-0.01924534,0.0064782407,-0.0004947246,0.014914385,0.020257032,0.024747549,-0.0028037897,0.02572,0.01042722,-0.017618796,-0.0017551184,0.066813596,0.024128279,0.0014629116,-0.041159235,0.0170759,0.035749484,0.003679245,0.02763221,-0.020451235,-0.007987266,0.021445181,0.023096954,-0.009097355,-0.013019162,-0.0068803183,-0.055891007,0.04052977,0.026022024,0.0020699173,0.057558686,-0.011048485,-0.0020403832,0.0017898538,0.027355764,0.07308732,-0.053717494,0.03232049,0.055085182,0.00018102772,-0.013487991,-0.018423969,0.013138332,0.050584562,0.001089859,-0.021440402,0.016691031,-0.025720831,0.015573468,-0.0005563322,-0.010705168,0.014974883,0.021904908,-0.004575984,-0.039623562,0.06545269,0.004069165,-0.005121101,0.023448188,-0.030555721,0.04940593,-0.047986448,0.016158756,0.03211412,0.015259023,-0.008867201,-0.010838573,-0.00907481,0.00738705,-0.011403523,0.03340103,-0.014517178,-0.0020951899,-0.0033497266,0.017332515,-0.027975107,0.020816734,-0.004670217,0.008733338,-0.057189718,0.04293931,-0.028729273,-0.005976623,0.0061184554,0.0036841463,-0.010110966,-0.010252381,0.013242769,0.007250107,0.0042511667,0.0019006601,-0.014265549,0.0010971746,0.03682944,0.016796151,-0.022223013,-0.026489593,0.0083898185,-0.033204887,0.010326838,0.0339958,0.05171946,-0.024227938,0.021882221,0.0038232487,-0.021335833,-0.0029253259,-0.005231141,-0.0041421656,-0.0031236757,0.023540242,0.009578585,-0.021926979,0.013883458,-0.023144074,0.01784178,0.025706725,0.026498005,0.028042786,0.05865991,0.031012688,-0.065113954,-0.010235891,0.013289271,0.013998163,-0.018078465,-0.04092795,0.0005445361,-0.0104656415,-0.04300593,-0.04437769,0.034660142,-0.021811217,0.003647727,-0.0410403,0.027396686,0.043572005,0.01895622,-0.003808624,0.033303108,-0.056025628,0.045153547,-0.00019974697,-0.027559074,-0.0013386054,0.0009893113,-0.029075513,0.015029295,-0.015701307,-0.010224935,-0.011312172,0.090817384,0.0077919173,-0.009448503,-0.07079103,0.033825707,-0.048268046,0.016591378,0.025220243,0.018991845,-0.010872638,-0.0042067724,-0.010943021,0.020645436,0.049996126,-0.008244126,0.00041558908,0.016062051,0.0098896185,0.017726785,-0.00929662,0.029595274,-0.0059435028,0.01491849,0.005128672,0.0032728212,-0.045266896,0.013264254,-0.02060119,-0.037434526,-0.04834917,-0.02969345,-0.025282318,-0.008440751,0.0054039704,0.014549717,0.016243784]	2026-09-08 09:32:54.310023+00
\.


--
-- Data for Name: control_work_scores; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.control_work_scores (id, control_work_id, student_name, score, created_at) FROM stdin;
\.


--
-- Data for Name: control_works; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.control_works (id, teacher_id, subject_id, class_id, quarter, year, work_date, title, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.documents (id, uploader_id, title, description, file_url, file_size, file_type, category, is_public, download_count, created_at) FROM stdin;
1	\N	Maktab ichki tartib qoidalari	O'quvchilar va xodimlar uchun ichki tartib qoidalari to'plami	/uploads/doc1.pdf	0	pdf	regulations	t	0	2026-09-08 09:32:00.895828+00
2	\N	2026-2027 o'quv yili ish rejasi	Maktabning yillik o'quv-tarbiya ishlari rejasi	/uploads/doc2.pdf	0	pdf	plans	t	0	2026-09-08 09:32:00.895828+00
3	\N	Bepul ovqatlanish tartibi haqida buyruq	Boshlang'ich sinf o'quvchilarini bepul ovqat bilan ta'minlash tartibi	/uploads/doc3.pdf	0	pdf	orders	t	0	2026-09-08 09:32:00.895828+00
\.


--
-- Data for Name: lesson_times; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.lesson_times (id, shift, lesson_num, start_time, end_time) FROM stdin;
1	1	1	08:00:00	08:45:00
2	1	2	08:50:00	09:35:00
3	1	3	09:45:00	10:30:00
4	1	4	10:45:00	11:30:00
5	1	5	11:35:00	12:20:00
6	1	6	12:25:00	13:10:00
7	2	1	13:30:00	14:15:00
8	2	2	14:20:00	15:05:00
9	2	3	15:15:00	16:00:00
10	2	4	16:05:00	16:50:00
11	2	5	16:55:00	17:40:00
12	2	6	17:45:00	18:30:00
\.


--
-- Data for Name: management; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.management (id, full_name, "position", photo_url, phone, email, order_num, is_active, created_at) FROM stdin;
4	Qalandarov Bahodir Sotivoldiyevich	Maktab direktori	\N	\N	\N	1	t	2026-09-08 09:32:00.893703+00
5	Yusupova Gulnora Rashidovna	O'quv ishlari bo'yicha direktor o'rinbosari	\N	\N	\N	2	t	2026-09-08 09:32:00.893703+00
6	Ermatov Sanjar Toxirovich	Tarbiya ishlari bo'yicha direktor o'rinbosari	\N	\N	\N	3	t	2026-09-08 09:32:00.893703+00
\.


--
-- Data for Name: media; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.media (id, uploader_id, url, thumb_url, file_type, file_size, alt_text, album, created_at, is_cover) FROM stdin;
\.


--
-- Data for Name: news; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.news (id, author_id, title, slug, content, cover_url, category, is_published, published_at, views, created_at, updated_at) FROM stdin;
1	\N	2026-2027 o'quv yili tantanali ochildi	oquv-yili-ochildi	Maktabimizda 2026-2027 o'quv yilining birinchi kuni tantanali marosim bilan nishonlandi. Marosimda 142 nafar birinchi sinf o'quvchisi ilk bor maktab ostonasidan qadam qo'ydi. Tadbirda tuman hokimligi vakillari, ota-onalar va faxriylar ishtirok etdi. Direktor o'z nutqida yangi o'quv yilida raqamli ta'lim yo'nalishiga alohida e'tibor qaratilishini ta'kidladi.	\N	event	t	2026-09-03 09:32:00.894492+00	0	2026-09-08 09:32:00.894492+00	2026-09-08 09:32:00.894492+00
2	\N	Kimyo laboratoriyasi yangi jihozlar bilan ta'minlandi	kimyo-laboratoriya	Maktabimizning kimyo laboratoriyasi zamonaviy jihozlar bilan to'liq yangilandi. Yangi jihozlar orasida raqamli mikroskoplar, elektron tarozilar va xavfsizlik shkaflari bor. Bu o'quvchilarga amaliy mashg'ulotlarni yanada sifatli o'tkazish imkonini beradi.	\N	news	t	2026-08-19 09:32:00.894492+00	0	2026-09-08 09:32:00.894492+00	2026-09-08 09:32:00.894492+00
3	\N	Ota-onalar yig'ilishi 15-sentyabrda bo'lib o'tadi	ota-onalar-yigilishi	Barcha sinflar bo'yicha umumiy ota-onalar yig'ilishi 15-sentyabr kuni soat 15:00 da maktab yig'ilishlar zalida o'tkaziladi. Kun tartibida: o'quv yili rejasi, ovqatlanish masalasi va sinf jamg'armasi muhokama qilinadi.	\N	announcement	t	2026-09-06 09:32:00.894492+00	0	2026-09-08 09:32:00.894492+00	2026-09-08 09:32:00.894492+00
4	\N	Ingliz tili to'garagi ishga tushdi	ingliz-tili-togaragi	Maktabimizda 5-9 sinf o'quvchilari uchun qo'shimcha ingliz tili to'garagi ochildi. Mashg'ulotlar har seshanba va payshanba kunlari soat 15:00 da o'tkaziladi. To'garakka yozilish uchun sinf rahbariga murojaat qiling.	\N	news	t	2026-08-29 09:32:00.894492+00	0	2026-09-08 09:32:00.894492+00	2026-09-08 09:32:00.894492+00
\.


--
-- Data for Name: otm_calibration; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.otm_calibration (id, slope, intercept, sample_size, computed_at) FROM stdin;
2	0.6608	23.4851	10	2026-09-10 11:42:37.986509+00
\.


--
-- Data for Name: otm_major_cutoffs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.otm_major_cutoffs (id, major_id, year, cutoff_score, max_possible_score) FROM stdin;
7	4	2025	146.00	189.90
8	4	2024	142.50	189.90
9	5	2025	153.80	189.90
10	5	2024	150.20	189.90
11	6	2025	131.00	189.90
12	6	2024	128.40	189.90
13	7	2025	138.20	189.90
14	7	2024	135.60	189.90
15	8	2025	168.30	189.90
16	8	2024	165.90	189.90
17	9	2025	160.40	189.90
18	9	2024	158.00	189.90
\.


--
-- Data for Name: otm_major_subjects; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.otm_major_subjects (id, major_id, subject_id, weight) FROM stdin;
7	4	5	1.5
8	4	1	2.0
9	5	10	1.5
10	5	1	2.0
11	6	3	1.5
12	6	1	1.5
13	7	2	1.0
14	7	3	2.0
15	8	7	2.0
16	8	6	2.0
17	9	3	1.5
18	9	8	1.5
\.


--
-- Data for Name: otm_majors; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.otm_majors (id, university_name, major_name, is_active, created_at) FROM stdin;
4	TATU (Toshkent Axborot Texnologiyalari Universiteti)	Kompyuter injiniringi	t	2026-09-10 11:42:20.223443+00
5	TATU (Toshkent Axborot Texnologiyalari Universiteti)	Dasturiy injiniring	t	2026-09-10 11:42:20.223443+00
6	Toshkent Davlat Iqtisodiyot Universiteti	Iqtisodiyot	t	2026-09-10 11:42:20.223443+00
7	Alisher Navoiy nomidagi TDO'TAU	Filologiya (Ingliz tili)	t	2026-09-10 11:42:20.223443+00
8	Toshkent Tibbiyot Akademiyasi	Davolash ishi	t	2026-09-10 11:42:20.223443+00
9	O'zbekiston Milliy Universiteti	Xalqaro munosabatlar	t	2026-09-10 11:42:20.223443+00
\.


--
-- Data for Name: otm_outcome_reports; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.otm_outcome_reports (id, student_name, class_name, graduation_year, major_id, internal_weighted_pct, real_dtm_score, real_dtm_max_score, was_admitted, notes, created_by, created_at) FROM stdin;
9	Karimov Jasur	11-A	2024	4	72.00	128.00	189.90	f	Chegaradan past	1	2026-09-10 11:42:20.223443+00
10	Aliyeva Malika	11-A	2024	4	88.50	149.20	189.90	t	Yaxshi natija, qabul qilindi	1	2026-09-10 11:42:20.223443+00
11	Yusupova Nilufar	11-B	2024	5	91.20	156.40	189.90	t	\N	1	2026-09-10 11:42:20.223443+00
12	Nazarova Sabina	11-A	2025	6	65.40	120.10	189.90	f	Ingliz tilidan past ball	1	2026-09-10 11:42:20.223443+00
13	Sodiqov Otabek	11-B	2024	6	80.00	133.50	189.90	t	\N	1	2026-09-10 11:42:20.223443+00
14	Rustamov Diyor	11-B	2025	7	85.70	140.90	189.90	t	\N	1	2026-09-10 11:42:20.223443+00
15	Tursunov Bekzod	11-B	2025	8	78.90	161.20	189.90	f	Kimyo bo'yicha tayyorgarlik yetarli emas edi	1	2026-09-10 11:42:20.223443+00
16	Ergasheva Madina	11-A	2025	8	94.30	170.50	189.90	t	A'lo natija	1	2026-09-10 11:42:20.223443+00
17	Xolmatov Sherzod	11-B	2024	9	69.10	142.00	189.90	f	Tarix fanidan qo'shimcha tayyorgarlik kerak edi	1	2026-09-10 11:42:20.223443+00
18	Ismoilova Zarina	11-A	2024	9	82.60	157.80	189.90	t	\N	1	2026-09-10 11:42:20.223443+00
\.


--
-- Data for Name: questions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.questions (id, teacher_id, subject_id, grade_level, text, option_a, option_b, option_c, option_d, correct, difficulty, is_active, created_at) FROM stdin;
\.


--
-- Data for Name: schedule; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.schedule (id, class_id, subject_id, teacher_id, day_of_week, lesson_num, shift, room) FROM stdin;
1	1	4	4	1	1	2	101
2	1	5	2	1	2	2	102
3	1	6	3	1	3	2	103
4	1	1	4	1	4	2	104
5	1	5	2	2	1	2	101
6	1	6	3	2	2	2	102
7	1	1	4	2	3	2	103
8	1	2	2	2	4	2	104
9	1	6	3	3	1	2	101
10	1	1	4	3	2	2	102
11	1	2	2	3	3	2	103
12	1	3	3	3	4	2	104
13	1	1	4	4	1	2	101
14	1	2	2	4	2	2	102
15	1	3	3	4	3	2	103
16	1	4	4	4	4	2	104
17	1	2	2	5	1	2	101
18	1	3	3	5	2	2	102
19	1	4	4	5	3	2	103
20	1	5	2	5	4	2	104
21	1	3	3	6	1	2	101
22	1	4	4	6	2	2	102
23	1	5	2	6	3	2	103
24	1	6	3	6	4	2	104
25	2	5	4	1	1	2	101
26	2	6	2	1	2	2	102
27	2	1	3	1	3	2	103
28	2	2	4	1	4	2	104
29	2	6	2	2	1	2	101
30	2	1	3	2	2	2	102
31	2	2	4	2	3	2	103
32	2	3	2	2	4	2	104
33	2	1	3	3	1	2	101
34	2	2	4	3	2	2	102
35	2	3	2	3	3	2	103
36	2	4	3	3	4	2	104
37	2	2	4	4	1	2	101
38	2	3	2	4	2	2	102
39	2	4	3	4	3	2	103
40	2	5	4	4	4	2	104
41	2	3	2	5	1	2	101
42	2	4	3	5	2	2	102
43	2	5	4	5	3	2	103
44	2	6	2	5	4	2	104
45	2	4	3	6	1	2	101
46	2	5	4	6	2	2	102
47	2	6	2	6	3	2	103
48	2	1	3	6	4	2	104
49	3	6	4	1	1	2	101
50	3	1	2	1	2	2	102
51	3	2	3	1	3	2	103
52	3	3	4	1	4	2	104
53	3	1	2	2	1	2	101
54	3	2	3	2	2	2	102
55	3	3	4	2	3	2	103
56	3	4	2	2	4	2	104
57	3	2	3	3	1	2	101
58	3	3	4	3	2	2	102
59	3	4	2	3	3	2	103
60	3	5	3	3	4	2	104
61	3	3	4	4	1	2	101
62	3	4	2	4	2	2	102
63	3	5	3	4	3	2	103
64	3	6	4	4	4	2	104
65	3	4	2	5	1	2	101
66	3	5	3	5	2	2	102
67	3	6	4	5	3	2	103
68	3	1	2	5	4	2	104
69	3	5	3	6	1	2	101
70	3	6	4	6	2	2	102
71	3	1	2	6	3	2	103
72	3	2	3	6	4	2	104
73	4	1	4	1	1	2	101
74	4	2	2	1	2	2	102
75	4	3	3	1	3	2	103
76	4	4	4	1	4	2	104
77	4	2	2	2	1	2	101
78	4	3	3	2	2	2	102
79	4	4	4	2	3	2	103
80	4	5	2	2	4	2	104
81	4	3	3	3	1	2	101
82	4	4	4	3	2	2	102
83	4	5	2	3	3	2	103
84	4	6	3	3	4	2	104
85	4	4	4	4	1	2	101
86	4	5	2	4	2	2	102
87	4	6	3	4	3	2	103
88	4	1	4	4	4	2	104
89	4	5	2	5	1	2	101
90	4	6	3	5	2	2	102
91	4	1	4	5	3	2	103
92	4	2	2	5	4	2	104
93	4	6	3	6	1	2	101
94	4	1	4	6	2	2	102
95	4	2	2	6	3	2	103
96	4	3	3	6	4	2	104
\.


--
-- Data for Name: school_info; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.school_info (id, key, title, content, updated_by, updated_at) FROM stdin;
1	history	Maktab tarixi	Shomanay tumani 14-umumiy o'rta ta'lim maktabi 1985-yilda tashkil etilgan. Maktab O'zbekiston Respublikasining Qoraqalpog'iston Respublikasi Shomanay tumanida joylashgan bo'lib, yillar davomida minglab o'quvchilarga ta'lim bergan.	\N	2026-09-08 09:28:16.371434+00
2	mission	Missiyamiz	Har bir o'quvchini zamonaviy bilim va ko'nikmalar bilan qurollantirish, milliy qadriyatlarni asrash va yosh avlodni barkamol inson sifatida tarbiyalash.	\N	2026-09-08 09:28:16.371434+00
3	vision	Maqsadimiz	2030 yilga kelib viloyatdagi eng nufuzli maktabga aylanish, o'quvchilarning xalqaro olimpiadalardagi ishtirokini kengaytirish.	\N	2026-09-08 09:28:16.371434+00
4	address	Manzil	Qoraqalpog'iston Respublikasi, Shomanay tumani, Markaziy ko'cha, 14-maktab	\N	2026-09-08 09:28:16.371434+00
5	phone	Telefon	+998 61 XXX-XX-XX	\N	2026-09-08 09:28:16.371434+00
6	email	Email	maktab14shomanay@edu.uz	\N	2026-09-08 09:28:16.371434+00
7	work_hours	Ish vaqti	Dushanba–Shanba: 08:00–18:00	\N	2026-09-08 09:28:16.371434+00
8	founded	Tashkil etilgan	1985-yil	\N	2026-09-08 09:28:16.371434+00
9	admission	Maktabga qabul	Birinchi sinfga qabul har yili 1-iyundan 25-avgustgacha davom etadi. Hujjatlar ro'yxati: bolaning tug'ilganlik haqidagi guvohnomasi nusxasi, ota-onaning pasport nusxasi, tibbiy ma'lumotnoma (086/u shakli), 6 dona 3x4 o'lchamdagi fotosurat. Hujjatlar maktab kotibiyatiga ish kunlari soat 09:00 dan 16:00 gacha topshiriladi.	\N	2026-09-08 09:32:00.892641+00
10	uniform	Maktab formasi	O'quvchilar uchun maktab formasi majburiy. Yigitlar uchun: to'q ko'k kostyum, oq ko'ylak, galstuk. Qizlar uchun: to'q ko'k sarafan yoki yubka, oq bluzka. Sport darslari uchun alohida sport kiyimi talab etiladi.	\N	2026-09-08 09:32:00.892641+00
11	meals	Ovqatlanish	Maktabda 1-4 sinf o'quvchilari uchun bepul issiq ovqat tashkil etilgan. Oshxona soat 10:30 dan 14:00 gacha ishlaydi. Yuqori sinf o'quvchilari uchun bufet xizmati mavjud.	\N	2026-09-08 09:32:00.892641+00
12	library	Kutubxona	Maktab kutubxonasida 12 mingdan ortiq kitob mavjud. Kutubxona dushanbadan shanbagacha soat 08:00 dan 17:00 gacha ochiq. O'quvchilar darslikni bir o'quv yiliga oladi.	\N	2026-09-08 09:32:00.892641+00
\.


--
-- Data for Name: subjects; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.subjects (id, name, short_name, icon, created_at, description, updated_at) FROM stdin;
1	Matematika	Mat	➕	2026-09-08 09:28:16.336848+00	\N	2026-09-08 09:28:16.371434+00
2	O'zbek tili va adabiyoti	O'zbek	📖	2026-09-08 09:28:16.336848+00	\N	2026-09-08 09:28:16.371434+00
3	Ingliz tili	Ingliz	🌐	2026-09-08 09:28:16.336848+00	\N	2026-09-08 09:28:16.371434+00
4	Rus tili	Rus	🇷🇺	2026-09-08 09:28:16.336848+00	\N	2026-09-08 09:28:16.371434+00
5	Fizika	Fiz	⚛️	2026-09-08 09:28:16.336848+00	\N	2026-09-08 09:28:16.371434+00
6	Kimyo	Kim	🧪	2026-09-08 09:28:16.336848+00	\N	2026-09-08 09:28:16.371434+00
7	Biologiya	Bio	🌿	2026-09-08 09:28:16.336848+00	\N	2026-09-08 09:28:16.371434+00
8	Tarix	Tar	🏛️	2026-09-08 09:28:16.336848+00	\N	2026-09-08 09:28:16.371434+00
9	Geografiya	Geo	🗺️	2026-09-08 09:28:16.336848+00	\N	2026-09-08 09:28:16.371434+00
10	Informatika	Info	💻	2026-09-08 09:28:16.336848+00	\N	2026-09-08 09:28:16.371434+00
11	Jismoniy tarbiya	JT	⚽	2026-09-08 09:28:16.336848+00	\N	2026-09-08 09:28:16.371434+00
12	Musiqa	Mus	🎵	2026-09-08 09:28:16.336848+00	\N	2026-09-08 09:28:16.371434+00
13	Tasviriy san'at	TS	🎨	2026-09-08 09:28:16.336848+00	\N	2026-09-08 09:28:16.371434+00
14	Texnologiya	Tex	🔧	2026-09-08 09:28:16.336848+00	\N	2026-09-08 09:28:16.371434+00
15	Ona tili (QQ)	QQ	📝	2026-09-08 09:28:16.336848+00	\N	2026-09-08 09:28:16.371434+00
\.


--
-- Data for Name: teacher_subjects; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.teacher_subjects (id, teacher_id, subject_id) FROM stdin;
1	2	1
2	3	3
3	4	5
4	13	7
\.


--
-- Data for Name: test_configs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.test_configs (id, teacher_id, subject_id, title, description, grade_level, mode, time_limit, question_count, difficulty, is_active, created_at, updated_at, file_url, file_type, answer_key, target_classes) FROM stdin;
\.


--
-- Data for Name: test_sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.test_sessions (id, student_name, class_name, subject_id, grade_level, total_q, correct_q, score, time_spent, started_at, finished_at, config_id) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, login, password_hash, full_name, role, photo_url, phone, is_active, created_at, updated_at, bio, experience_years, education, achievements_text, is_public) FROM stdin;
2	aliyev_a	$2b$12$demo	Aliyev Aziz Baxtiyorovich	teacher	\N	\N	t	2026-09-08 09:32:00.89834+00	2026-09-08 09:32:00.89834+00	Oliy toifali matematika o'qituvchisi. O'quvchilari har yili olimpiadalarda yuqori natijalarga erishadi.	18	Toshkent davlat pedagogika universiteti, matematika fakulteti	\N	t
3	rahimova_d	$2b$12$demo	Rahimova Dilnoza Erkinovna	teacher	\N	\N	t	2026-09-08 09:32:00.902294+00	2026-09-08 09:32:00.902294+00	IELTS 8.0 sertifikati egasi. Xalqaro almashuv dasturlari koordinatori.	12	O'zbekiston davlat jahon tillari universiteti	\N	t
4	toshmatov_s	$2b$12$demo	Toshmatov Sardor Ulugbekovich	teacher	\N	\N	t	2026-09-08 09:32:00.904004+00	2026-09-08 09:32:00.904004+00	Fizika va astronomiya o'qituvchisi, maktab ilmiy to'garagi rahbari.	9	Nukus davlat pedagogika instituti	\N	t
1	admin	$2b$12$wNuZu4ISzsBNW6csuDFAPuqkQE.YzcwQZrML5bjl5KOs0fEgHkQ9y	Bosh Administrator	super_admin	\N	\N	t	2026-09-08 09:28:16.744251+00	2026-09-08 09:28:16.744251+00	\N	0	\N	\N	f
13	azamat_one	$2b$12$LlzHKT70DlMseJKXVmZbPu41gbBd8V7WJklG2oO0zbBlCTOliT0mq	Azamat Yakubbaev	teacher	\N	+998901234567	t	2026-09-10 11:50:33.990499+00	2026-09-10 11:50:33.990499+00	\N	0	\N	\N	f
\.


--
-- Name: achievements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.achievements_id_seq', 3, true);


--
-- Name: ai_usage_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ai_usage_id_seq', 15, true);


--
-- Name: block_test_sections_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.block_test_sections_id_seq', 1, false);


--
-- Name: block_test_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.block_test_sessions_id_seq', 5, true);


--
-- Name: block_tests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.block_tests_id_seq', 3, true);


--
-- Name: chat_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.chat_messages_id_seq', 30, true);


--
-- Name: chat_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.chat_sessions_id_seq', 13, true);


--
-- Name: classes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.classes_id_seq', 4, true);


--
-- Name: contact_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.contact_messages_id_seq', 1, false);


--
-- Name: content_embeddings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.content_embeddings_id_seq', 28, true);


--
-- Name: control_work_scores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.control_work_scores_id_seq', 1, false);


--
-- Name: control_works_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.control_works_id_seq', 1, false);


--
-- Name: documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.documents_id_seq', 3, true);


--
-- Name: lesson_times_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.lesson_times_id_seq', 12, true);


--
-- Name: management_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.management_id_seq', 6, true);


--
-- Name: media_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.media_id_seq', 1, false);


--
-- Name: news_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.news_id_seq', 4, true);


--
-- Name: otm_calibration_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.otm_calibration_id_seq', 2, true);


--
-- Name: otm_major_cutoffs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.otm_major_cutoffs_id_seq', 18, true);


--
-- Name: otm_major_subjects_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.otm_major_subjects_id_seq', 18, true);


--
-- Name: otm_majors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.otm_majors_id_seq', 9, true);


--
-- Name: otm_outcome_reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.otm_outcome_reports_id_seq', 18, true);


--
-- Name: questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.questions_id_seq', 1, false);


--
-- Name: schedule_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.schedule_id_seq', 96, true);


--
-- Name: school_info_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.school_info_id_seq', 12, true);


--
-- Name: subjects_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.subjects_id_seq', 15, true);


--
-- Name: teacher_subjects_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.teacher_subjects_id_seq', 4, true);


--
-- Name: test_configs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.test_configs_id_seq', 1, false);


--
-- Name: test_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.test_sessions_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 13, true);


--
-- Name: _migrations _migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._migrations
    ADD CONSTRAINT _migrations_pkey PRIMARY KEY (filename);


--
-- Name: achievements achievements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.achievements
    ADD CONSTRAINT achievements_pkey PRIMARY KEY (id);


--
-- Name: ai_usage ai_usage_feature_month_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_usage
    ADD CONSTRAINT ai_usage_feature_month_key UNIQUE (feature, month);


--
-- Name: ai_usage ai_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_usage
    ADD CONSTRAINT ai_usage_pkey PRIMARY KEY (id);


--
-- Name: block_test_sections block_test_sections_block_test_id_subject_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.block_test_sections
    ADD CONSTRAINT block_test_sections_block_test_id_subject_id_key UNIQUE (block_test_id, subject_id);


--
-- Name: block_test_sections block_test_sections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.block_test_sections
    ADD CONSTRAINT block_test_sections_pkey PRIMARY KEY (id);


--
-- Name: block_test_sessions block_test_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.block_test_sessions
    ADD CONSTRAINT block_test_sessions_pkey PRIMARY KEY (id);


--
-- Name: block_tests block_tests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.block_tests
    ADD CONSTRAINT block_tests_pkey PRIMARY KEY (id);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: chat_sessions chat_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_sessions
    ADD CONSTRAINT chat_sessions_pkey PRIMARY KEY (id);


--
-- Name: chat_sessions chat_sessions_session_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_sessions
    ADD CONSTRAINT chat_sessions_session_key_key UNIQUE (session_key);


--
-- Name: classes classes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_pkey PRIMARY KEY (id);


--
-- Name: contact_messages contact_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_messages
    ADD CONSTRAINT contact_messages_pkey PRIMARY KEY (id);


--
-- Name: content_embeddings content_embeddings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_embeddings
    ADD CONSTRAINT content_embeddings_pkey PRIMARY KEY (id);


--
-- Name: content_embeddings content_embeddings_source_table_source_id_chunk_index_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_embeddings
    ADD CONSTRAINT content_embeddings_source_table_source_id_chunk_index_key UNIQUE (source_table, source_id, chunk_index);


--
-- Name: control_work_scores control_work_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.control_work_scores
    ADD CONSTRAINT control_work_scores_pkey PRIMARY KEY (id);


--
-- Name: control_works control_works_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.control_works
    ADD CONSTRAINT control_works_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: lesson_times lesson_times_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_times
    ADD CONSTRAINT lesson_times_pkey PRIMARY KEY (id);


--
-- Name: lesson_times lesson_times_shift_lesson_num_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_times
    ADD CONSTRAINT lesson_times_shift_lesson_num_key UNIQUE (shift, lesson_num);


--
-- Name: management management_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.management
    ADD CONSTRAINT management_pkey PRIMARY KEY (id);


--
-- Name: media media_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media
    ADD CONSTRAINT media_pkey PRIMARY KEY (id);


--
-- Name: news news_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news
    ADD CONSTRAINT news_pkey PRIMARY KEY (id);


--
-- Name: news news_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news
    ADD CONSTRAINT news_slug_key UNIQUE (slug);


--
-- Name: otm_calibration otm_calibration_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.otm_calibration
    ADD CONSTRAINT otm_calibration_pkey PRIMARY KEY (id);


--
-- Name: otm_major_cutoffs otm_major_cutoffs_major_id_year_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.otm_major_cutoffs
    ADD CONSTRAINT otm_major_cutoffs_major_id_year_key UNIQUE (major_id, year);


--
-- Name: otm_major_cutoffs otm_major_cutoffs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.otm_major_cutoffs
    ADD CONSTRAINT otm_major_cutoffs_pkey PRIMARY KEY (id);


--
-- Name: otm_major_subjects otm_major_subjects_major_id_subject_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.otm_major_subjects
    ADD CONSTRAINT otm_major_subjects_major_id_subject_id_key UNIQUE (major_id, subject_id);


--
-- Name: otm_major_subjects otm_major_subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.otm_major_subjects
    ADD CONSTRAINT otm_major_subjects_pkey PRIMARY KEY (id);


--
-- Name: otm_majors otm_majors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.otm_majors
    ADD CONSTRAINT otm_majors_pkey PRIMARY KEY (id);


--
-- Name: otm_outcome_reports otm_outcome_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.otm_outcome_reports
    ADD CONSTRAINT otm_outcome_reports_pkey PRIMARY KEY (id);


--
-- Name: questions questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_pkey PRIMARY KEY (id);


--
-- Name: schedule schedule_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule
    ADD CONSTRAINT schedule_pkey PRIMARY KEY (id);


--
-- Name: school_info school_info_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.school_info
    ADD CONSTRAINT school_info_key_key UNIQUE (key);


--
-- Name: school_info school_info_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.school_info
    ADD CONSTRAINT school_info_pkey PRIMARY KEY (id);


--
-- Name: subjects subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_pkey PRIMARY KEY (id);


--
-- Name: teacher_subjects teacher_subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_subjects
    ADD CONSTRAINT teacher_subjects_pkey PRIMARY KEY (id);


--
-- Name: teacher_subjects teacher_subjects_teacher_id_subject_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_subjects
    ADD CONSTRAINT teacher_subjects_teacher_id_subject_id_key UNIQUE (teacher_id, subject_id);


--
-- Name: test_configs test_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_configs
    ADD CONSTRAINT test_configs_pkey PRIMARY KEY (id);


--
-- Name: test_sessions test_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_sessions
    ADD CONSTRAINT test_sessions_pkey PRIMARY KEY (id);


--
-- Name: classes unique_classes_name; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT unique_classes_name UNIQUE (name);


--
-- Name: subjects unique_subject_name; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT unique_subject_name UNIQUE (name);


--
-- Name: users users_login_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_login_key UNIQUE (login);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_chat_messages_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_messages_session ON public.chat_messages USING btree (session_id, created_at);


--
-- Name: idx_chat_messages_ungrounded; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_messages_ungrounded ON public.chat_messages USING btree (created_at DESC) WHERE (was_grounded = false);


--
-- Name: idx_chat_sessions_activity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_sessions_activity ON public.chat_sessions USING btree (last_active_at);


--
-- Name: idx_control_works_class; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_control_works_class ON public.control_works USING btree (class_id, quarter, year);


--
-- Name: idx_embeddings_source; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_embeddings_source ON public.content_embeddings USING btree (source_table, source_id);


--
-- Name: idx_embeddings_tsv; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_embeddings_tsv ON public.content_embeddings USING gin (tsv);


--
-- Name: idx_embeddings_vec; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_embeddings_vec ON public.content_embeddings USING hnsw (embedding public.vector_cosine_ops);


--
-- Name: idx_news_published; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_news_published ON public.news USING btree (is_published, published_at DESC);


--
-- Name: idx_news_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_news_slug ON public.news USING btree (slug);


--
-- Name: idx_otm_calibration_computed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_otm_calibration_computed ON public.otm_calibration USING btree (computed_at DESC);


--
-- Name: idx_otm_major_cutoffs_major; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_otm_major_cutoffs_major ON public.otm_major_cutoffs USING btree (major_id, year DESC);


--
-- Name: idx_otm_major_subjects_major; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_otm_major_subjects_major ON public.otm_major_subjects USING btree (major_id);


--
-- Name: idx_otm_outcome_reports_major; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_otm_outcome_reports_major ON public.otm_outcome_reports USING btree (major_id);


--
-- Name: idx_questions_subject; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_questions_subject ON public.questions USING btree (subject_id, is_active);


--
-- Name: idx_schedule_class_day; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_schedule_class_day ON public.schedule USING btree (class_id, day_of_week);


--
-- Name: idx_test_sessions_subject; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_test_sessions_subject ON public.test_sessions USING btree (subject_id);


--
-- Name: achievements achievements_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.achievements
    ADD CONSTRAINT achievements_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE SET NULL;


--
-- Name: block_test_sections block_test_sections_block_test_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.block_test_sections
    ADD CONSTRAINT block_test_sections_block_test_id_fkey FOREIGN KEY (block_test_id) REFERENCES public.block_tests(id) ON DELETE CASCADE;


--
-- Name: block_test_sections block_test_sections_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.block_test_sections
    ADD CONSTRAINT block_test_sections_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;


--
-- Name: block_test_sessions block_test_sessions_block_test_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.block_test_sessions
    ADD CONSTRAINT block_test_sessions_block_test_id_fkey FOREIGN KEY (block_test_id) REFERENCES public.block_tests(id) ON DELETE CASCADE;


--
-- Name: block_tests block_tests_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.block_tests
    ADD CONSTRAINT block_tests_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: chat_messages chat_messages_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.chat_sessions(id) ON DELETE CASCADE;


--
-- Name: control_work_scores control_work_scores_control_work_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.control_work_scores
    ADD CONSTRAINT control_work_scores_control_work_id_fkey FOREIGN KEY (control_work_id) REFERENCES public.control_works(id) ON DELETE CASCADE;


--
-- Name: control_works control_works_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.control_works
    ADD CONSTRAINT control_works_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;


--
-- Name: control_works control_works_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.control_works
    ADD CONSTRAINT control_works_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;


--
-- Name: control_works control_works_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.control_works
    ADD CONSTRAINT control_works_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: documents documents_uploader_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_uploader_id_fkey FOREIGN KEY (uploader_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: media media_uploader_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media
    ADD CONSTRAINT media_uploader_id_fkey FOREIGN KEY (uploader_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: news news_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news
    ADD CONSTRAINT news_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: otm_major_cutoffs otm_major_cutoffs_major_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.otm_major_cutoffs
    ADD CONSTRAINT otm_major_cutoffs_major_id_fkey FOREIGN KEY (major_id) REFERENCES public.otm_majors(id) ON DELETE CASCADE;


--
-- Name: otm_major_subjects otm_major_subjects_major_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.otm_major_subjects
    ADD CONSTRAINT otm_major_subjects_major_id_fkey FOREIGN KEY (major_id) REFERENCES public.otm_majors(id) ON DELETE CASCADE;


--
-- Name: otm_major_subjects otm_major_subjects_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.otm_major_subjects
    ADD CONSTRAINT otm_major_subjects_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;


--
-- Name: otm_outcome_reports otm_outcome_reports_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.otm_outcome_reports
    ADD CONSTRAINT otm_outcome_reports_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: otm_outcome_reports otm_outcome_reports_major_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.otm_outcome_reports
    ADD CONSTRAINT otm_outcome_reports_major_id_fkey FOREIGN KEY (major_id) REFERENCES public.otm_majors(id) ON DELETE SET NULL;


--
-- Name: questions questions_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;


--
-- Name: questions questions_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: schedule schedule_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule
    ADD CONSTRAINT schedule_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;


--
-- Name: schedule schedule_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule
    ADD CONSTRAINT schedule_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;


--
-- Name: schedule schedule_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule
    ADD CONSTRAINT schedule_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: school_info school_info_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.school_info
    ADD CONSTRAINT school_info_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: teacher_subjects teacher_subjects_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_subjects
    ADD CONSTRAINT teacher_subjects_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;


--
-- Name: teacher_subjects teacher_subjects_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_subjects
    ADD CONSTRAINT teacher_subjects_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: test_configs test_configs_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_configs
    ADD CONSTRAINT test_configs_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;


--
-- Name: test_configs test_configs_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_configs
    ADD CONSTRAINT test_configs_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: test_sessions test_sessions_config_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_sessions
    ADD CONSTRAINT test_sessions_config_id_fkey FOREIGN KEY (config_id) REFERENCES public.test_configs(id) ON DELETE SET NULL;


--
-- Name: test_sessions test_sessions_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_sessions
    ADD CONSTRAINT test_sessions_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict jjQx9700N7DVSw2c3OzXdfHq9WB83uah2ToU7Bzf4iozKESaeOVR6acf3O7yUsQ

