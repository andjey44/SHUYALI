// Chill Supabase client
// Uses browser-safe publishable key.

(function () {
  const SUPABASE_URL = 'https://sfqrtvmiuqtgsahhiiyx.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_ZfQgtiyFxxR3em8YcuaV7A_BB33-AOY';

  if (!window.supabase) {
    console.error('Supabase CDN not loaded');
    return;
  }

  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  window.chillSupabase = {
    client,

    async getSession() {
      const {
        data: { session }
      } = await client.auth.getSession();

      return session;
    },

    async signUp(email, password) {
      return client.auth.signUp({
        email,
        password
      });
    },

    async signIn(email, password) {
      return client.auth.signInWithPassword({
        email,
        password
      });
    },

    async signOut() {
      return client.auth.signOut();
    },

    async getProducts() {
      const { data, error } = await client
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error(error);
        return [];
      }

      return data || [];
    },

    async addProduct(product) {
      const {
        data: { user }
      } = await client.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await client
        .from('products')
        .insert([
          {
            user_id: user.id,
            name: product.name,
            category: product.category || 'other',
            expiry_date: product.expiry_date,
            price: product.price || 0,
            status: 'active'
          }
        ])
        .select();

      if (error) {
        console.error(error);
        throw error;
      }

      return data;
    },

    async deleteProduct(productId) {
      return client
        .from('products')
        .delete()
        .eq('id', productId);
    },

    async getShoppingItems() {
      const { data, error } = await client
        .from('shopping_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error(error);
        return [];
      }

      return data || [];
    },

    async addShoppingItem(item) {
      const {
        data: { user }
      } = await client.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await client
        .from('shopping_items')
        .insert([
          {
            user_id: user.id,
            name: item.name,
            category: item.category || 'other',
            quantity: item.quantity || '1'
          }
        ])
        .select();

      if (error) {
        console.error(error);
        throw error;
      }

      return data;
    }
  };

  console.log('Chill Supabase connected 🚀');
})();
