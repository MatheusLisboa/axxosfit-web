-- Permite que o personal logado registre seus próprios pagamentos (ex.: sync pós-Asaas)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'payments'
      AND policyname = 'Personal insere seus pagamentos'
  ) THEN
    CREATE POLICY "Personal insere seus pagamentos"
      ON public.payments
      FOR INSERT
      WITH CHECK (auth.uid() = trainer_id);
  END IF;
END $$;
