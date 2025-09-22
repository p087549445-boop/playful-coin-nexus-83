-- Add is_banned column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN is_banned BOOLEAN NOT NULL DEFAULT FALSE;

-- Add banned_at column to track when user was banned
ALTER TABLE public.profiles 
ADD COLUMN banned_at TIMESTAMP WITH TIME ZONE NULL;

-- Add banned_by column to track who banned the user
ALTER TABLE public.profiles 
ADD COLUMN banned_by UUID NULL;

-- Add ban_reason column to track why user was banned
ALTER TABLE public.profiles 
ADD COLUMN ban_reason TEXT NULL;