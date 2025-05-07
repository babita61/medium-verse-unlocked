
-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create subscription_categories junction table
CREATE TABLE IF NOT EXISTS public.subscription_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(subscription_id, category_id)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    sent_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy for subscriptions
CREATE POLICY "Users can view their own subscriptions" 
ON public.subscriptions FOR SELECT 
TO authenticated 
USING (user_id = auth.uid() OR email = auth.jwt() ->> 'email');

CREATE POLICY "Users can insert their own subscriptions" 
ON public.subscriptions FOR INSERT
TO authenticated 
WITH CHECK (user_id = auth.uid() OR email = auth.jwt() ->> 'email');

CREATE POLICY "Users can update their own subscriptions" 
ON public.subscriptions FOR UPDATE
TO authenticated 
USING (user_id = auth.uid() OR email = auth.jwt() ->> 'email');

CREATE POLICY "Users can delete their own subscriptions" 
ON public.subscriptions FOR DELETE
TO authenticated 
USING (user_id = auth.uid() OR email = auth.jwt() ->> 'email');

-- Policy for subscription_categories
CREATE POLICY "Users can manage their subscription categories" 
ON public.subscription_categories FOR ALL
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.subscriptions s
        WHERE s.id = subscription_id
        AND (s.user_id = auth.uid() OR s.email = auth.jwt() ->> 'email')
    )
);

-- Add function to automatically create notifications
CREATE OR REPLACE FUNCTION public.create_post_notifications()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create notifications for published posts
  IF NEW.published = true THEN
    INSERT INTO public.notifications (subscription_id, post_id)
    SELECT DISTINCT s.id, NEW.id
    FROM public.subscriptions s
    JOIN public.subscription_categories sc ON s.id = sc.subscription_id
    WHERE sc.category_id = NEW.category_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on posts to automatically create notifications
CREATE TRIGGER create_post_notifications_trigger
AFTER INSERT OR UPDATE OF published, category_id ON public.posts
FOR EACH ROW
WHEN (NEW.published = true)
EXECUTE FUNCTION public.create_post_notifications();

-- Add function to update timestamps
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update timestamps
CREATE TRIGGER update_subscriptions_timestamp
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
