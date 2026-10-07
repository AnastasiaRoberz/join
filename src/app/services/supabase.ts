import { Service } from '@angular/core';
import { createClient } from '@supabase/supabase-js';

@Service()
export class Supabase {
  projectUrl = 'https://nnvjteipgjertrdzhhww.supabase.co';
  projectKey = 'sb_publishable_MfdCcewSWbbgiL-yF1eQnQ_CQoS8Cqs';

  supabase = createClient(this.projectUrl, this.projectKey);
}
