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

    async getSubscription() {
      const user = await this.getUser();

      if (!user) return null;

      let { data, error } = await client
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!data && error) {
        const rpcResult = await client.rpc('ensure_user_subscription', {
          target_user_id: user.id
        });

        if (rpcResult.error) {
          console.error(rpcResult.error);
          return null;
        }

        data = rpcResult.data;
      }

      return data;
    },

    async activatePremiumTestMode() {
      const user = await this.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      const { data, error } = await client
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          plan: 'premium',
          status: 'active',
          current_period_end: periodEnd.toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error(error);
        throw error;
      }

      return data;
    },

    hasPremiumAccess(subscription) {
      if (!subscription) return false;

      if (subscription.status === 'active') return true;

      if (subscription.status === 'trialing') {
        return new Date(subscription.trial_ends_at) > new Date();
      }

      return false;
    },

    getTrialDaysLeft(subscription) {
      if (!subscription || subscription.status !== 'trialing') return 0;

      const diff = new Date(subscription.trial_ends_at) - new Date();
      return Math.max(0, Math.ceil(diff / 86400000));
    },

    async getProducts() {
      const user = await this.getUser();

      if (!user) return [];

      const { data, error } = await client
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
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

    async markProductEaten(product) {
      const user = await this.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error: eventError } = await client
        .from('product_events')
        .insert([
          {
            user_id: user.id,
            product_id: product.id,
            product_name: product.name,
            category: product.category || 'other',
            event_type: 'eaten',
            price: product.price || 0
          }
        ]);

      if (eventError) {
        console.error(eventError);
      }

      const { error: updateError } = await client
        .from('products')
        .update({ status: 'eaten' })
        .eq('id', product.id)
        .eq('user_id', user.id);

      if (updateError) {
        console.error(updateError);
        throw updateError;
      }

      return true;
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
            quantity: item.quantity || '1',
            bought: item.bought || false
          }
        ])
        .select();

      if (error) {
        console.error(error);
        throw error;
      }

      return data;
    },

    async updateShoppingItemBought(itemId, bought) {
      const user = await this.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await client
        .from('shopping_items')
        .update({ bought })
        .eq('id', itemId)
        .eq('user_id', user.id);

      if (error) {
        console.error(error);
        throw error;
      }

      return true;
    },

    async deleteShoppingItem(itemId) {
      const user = await this.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await client
        .from('shopping_items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', user.id);

      if (error) {
        console.error(error);
        throw error;
      }

      return true;
    },

    async clearBoughtShoppingItems() {
      const user = await this.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await client
        .from('shopping_items')
        .delete()
        .eq('user_id', user.id)
        .eq('bought', true);

      if (error) {
        console.error(error);
        throw error;
      }

      return true;
    }
  };

  console.log('Chill Supabase connected 🚀');
})();
