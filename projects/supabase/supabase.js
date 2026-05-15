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

    async getUser() {
      const {
        data: { user },
        error
      } = await client.auth.getUser();

      if (error) {
        console.error(error);
        return null;
      }

      return user;
    },

    async signUp(email, password, fullName = '') {
      return client.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
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

    async getProfile() {
      const user = await this.getUser();

      if (!user) return null;

      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error(error);
        return {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || '',
          avatar_url: user.user_metadata?.avatar_url || ''
        };
      }

      return data;
    },

    async updateProfile(profile) {
      const user = await this.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await client
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          full_name: profile.full_name || '',
          avatar_url: profile.avatar_url || ''
        })
        .select()
        .single();

      if (error) {
        console.error(error);
        throw error;
      }

      return data;
    },

    async getUserSettings() {
      const user = await this.getUser();

      if (!user) return null;

      const { data, error } = await client
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error(error);
        return null;
      }

      return data;
    },

    async getProducts() {
      const user = await this.getUser();

      if (!user) return [];

      const { data, error } = await client
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error(error);
        return [];
      }

      return data || [];
    },

    async addProduct(product) {
      const user = await this.getUser();

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
      const user = await this.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      return client
        .from('products')
        .delete()
        .eq('id', productId)
        .eq('user_id', user.id);
    },

    async getShoppingItems() {
      const user = await this.getUser();

      if (!user) return [];

      const { data, error } = await client
        .from('shopping_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error(error);
        return [];
      }

      return data || [];
    },

    async addShoppingItem(item) {
      const user = await this.getUser();

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
