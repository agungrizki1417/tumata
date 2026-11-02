


const SUPABASE_URL = 'https://scyivawhhetzwucvfrwe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjeWl2YXdoaGV0end1Y3ZmcndlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI0NDk5ODYsImV4cCI6MjEwODAyNTk4Nn0.YiYe9-hB4oRhiintiO9Ht-zZdSe_4U_qTMt9AtXjbFw';


if (window.supabase && typeof window.supabase.createClient === 'function') {
  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
  console.error('SDK Supabase CDN belum dimuat!');
}