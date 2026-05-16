// Chill barcode scanner fallback
// Replaces the basic scanner with a more reliable flow:
// 1) Browser BarcodeDetector + camera when supported.
// 2) Manual barcode input when camera/scanner is unavailable.
// 3) If product is found, it is added to the fridge immediately.

(function () {
  let stream = null;
  let interval = null;
  let detector = null;

  function ensureManualBarcodeModal() {
    if (document.getElementById('manual-barcode-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'manual-barcode-modal';
    modal.className = 'modal-overlay';

    modal.innerHTML = `
      <div class="modal-box">
        <button class="modal-close" id="manual-barcode-close">×</button>
        <h3 class="modal-title">Ввести штрихкод</h3>
        <p style="color:var(--text-muted);margin-bottom:1rem">
          Введите цифры под штрихкодом на упаковке. Мы попробуем найти продукт в Open Food Facts и сразу добавить его в холодильник.
        </p>
        <div class="form-group">
          <label for="manual-barcode-input">Штрихкод с упаковки</label>
          <input id="manual-barcode-input" class="input" inputmode="numeric" placeholder="Например: 4607034021511" />
        </div>
        <button class="btn btn-primary btn-block" id="manual-barcode-submit">Найти и добавить</button>
        <button class="btn btn-outline btn-block" style="margin-top:.75rem" id="manual-open-product-form">Добавить вручную</button>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('manual-barcode-close').addEventListener('click', closeManualBarcodeModal);
    document.getElementById('manual-open-product-form').addEventListener('click', () => {
      closeManualBarcodeModal();
      openModal();
    });
    document.getElementById('manual-barcode-submit').addEventListener('click', async () => {
      const input = document.getElementById('manual-barcode-input');
      const barcode = input.value.trim();

      if (!barcode) {
        showToast('Введите штрихкод');
        return;
      }

      closeManualBarcodeModal();
      await window.fetchProductByBarcode(barcode);
    });
  }

  function openManualBarcodeModal() {
    ensureManualBarcodeModal();
    document.getElementById('manual-barcode-modal').classList.add('open');
    document.getElementById('manual-barcode-input').focus();
  }

  function closeManualBarcodeModal() {
    const modal = document.getElementById('manual-barcode-modal');
    if (!modal) return;
    modal.classList.remove('open');
  }

  function stopScanner() {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
    }
  }

  async function addFoundProductToFridge(product) {
    document.getElementById('add-name').value = product.name;
    document.getElementById('add-category').value = product.category;
    document.getElementById('add-expiry').value = product.expiryDate;
    document.getElementById('add-price').value = product.price || '';

    if (typeof window.addProduct === 'function') {
      await window.addProduct();
      return;
    }

    products.push({
      id: uid(),
      name: product.name,
      category: product.category,
      expiryDate: product.expiryDate,
      price: product.price || CATEGORY_PRICE[product.category] || 100,
      addedAt: new Date().toISOString()
    });

    save(KEYS.products, products);
    render();
  }

  window.closeCameraModal = function () {
    stopScanner();
    const modal = document.getElementById('camera-modal');
    if (modal) modal.classList.remove('open');
  };

  window.startBarcodeScanner = async function () {
    const hasCamera = Boolean(navigator.mediaDevices?.getUserMedia);
    const hasBarcodeDetector = 'BarcodeDetector' in window;

    if (!hasCamera) {
      showToast('Камера недоступна. Можно ввести штрихкод вручную.');
      openManualBarcodeModal();
      return;
    }

    if (!hasBarcodeDetector) {
      showToast('Авто-сканер не поддерживается этим браузером. Введите штрихкод вручную.');
      openManualBarcodeModal();
      return;
    }

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      const video = document.getElementById('barcode-video');
      video.srcObject = stream;

      const cameraModal = document.getElementById('camera-modal');
      cameraModal.classList.add('open');

      const status = document.getElementById('scan-status');
      status.textContent = 'Наведи камеру на штрихкод...';

      detector = new BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128']
      });

      interval = setInterval(async () => {
        try {
          if (video.readyState < 2) return;

          const barcodes = await detector.detect(video);

          if (barcodes.length > 0) {
            const barcode = barcodes[0].rawValue;
            status.textContent = `✓ Найден штрихкод: ${barcode}`;
            window.closeCameraModal();
            await window.fetchProductByBarcode(barcode);
          }
        } catch (error) {
          console.warn('Barcode frame skipped', error);
        }
      }, 500);
    } catch (error) {
      console.error(error);
      showToast('Нет доступа к камере. Введите штрихкод вручную.');
      openManualBarcodeModal();
    }
  };

  const originalFetchProductByBarcode = window.fetchProductByBarcode;
  window.fetchProductByBarcode = async function (barcode) {
    try {
      showToast('Ищем продукт по штрихкоду...');

      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(barcode)}.json`);
      const data = await res.json();

      if (data.status === 1 && data.product) {
        const p = data.product;
        const name = p.product_name_ru || p.product_name_en || p.product_name || `Продукт ${barcode}`;
        const tags = (p.categories_tags || []).map(c => c.toLowerCase());

        let category = 'other';
        for (const entry of OFF_CATEGORY_MAP) {
          if (entry.keywords.some(kw => tags.some(t => t.includes(kw)))) {
            category = entry.value;
            break;
          }
        }

        await addFoundProductToFridge({
          name,
          category,
          expiryDate: addDays(new Date(), CATEGORY_DEFAULT_DAYS[category] || 7),
          price: CATEGORY_PRICE[category] || 100
        });

        showToast(`✓ ${name} добавлен в холодильник`);
        return;
      }

      document.getElementById('add-name').value = '';
      document.getElementById('add-category').value = 'other';
      document.getElementById('add-expiry').value = addDays(new Date(), 7);
      openModal();
      showToast(`Продукт ${barcode} не найден. Заполни данные вручную.`);
    } catch (error) {
      console.error(error);

      if (typeof originalFetchProductByBarcode === 'function') {
        return originalFetchProductByBarcode(barcode);
      }

      showToast('Ошибка сети. Добавь продукт вручную.');
      openModal();
    }
  };
})();
