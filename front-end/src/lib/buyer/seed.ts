import { BuyerState } from "./model";

export function createInitialBuyerState(): BuyerState {
  return {
    selectedCategory: null,
    searchQuery: "",
    activeLiveSession: true,
    lockBoxPoints: [
      {
        id: "lb-lp-1",
        name: "Tienda Amiga San Pedro",
        address: "Calle Colombia #240 esq. Cañada Strongest",
        city: "La Paz",
        phone: "+591 71234567",
        capacity: 50,
      },
      {
        id: "lb-lp-2",
        name: "Minimarket Miraflores Central",
        address: "Av. Busch esq. Pasaje Triangular #112",
        city: "La Paz",
        phone: "+591 79876543",
        capacity: 40,
      },
      {
        id: "lb-lp-3",
        name: "Punto Calacoto Zona Sur",
        address: "Calle 15 de Calacoto #8022",
        city: "La Paz",
        phone: "+591 76543210",
        capacity: 60,
      },
    ],
    catalog: [
      {
        id: "p-1",
        sellerId: "s-1",
        sellerName: "TikTok Tech Store",
        categoryId: "cat-1",
        categoryName: "Tecnología y Streaming",
        title: "Aro de Luz LED RGB 26cm + Trípode Reforzado",
        description:
          "Ideal para directos en TikTok Live con regulador de luz y soporte para teléfono.",
        priceCents: 13000,
        stock: 25,
        sku: "TECH-ARO-01",
        imageUrl:
          "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=500&q=80",
        isLiveFeatured: true,
      },
      {
        id: "p-2",
        sellerId: "s-1",
        sellerName: "TikTok Tech Store",
        categoryId: "cat-1",
        categoryName: "Tecnología y Streaming",
        title: "Micrófono Lavalier Inalámbrico Tipo C / Lightning",
        description:
          "Cancelación activa de ruido para directos claros y sin estática.",
        priceCents: 9500,
        stock: 30,
        sku: "TECH-MIC-02",
        imageUrl:
          "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&q=80",
        isLiveFeatured: true,
      },
      {
        id: "p-3",
        sellerId: "s-2",
        sellerName: "Streetwear Bolivia",
        categoryId: "cat-2",
        categoryName: "Moda y Calzados",
        title: "Hoodie Oversize Streetwear Negro",
        description: "Algodón perchado grueso, corte relajado y unisex.",
        priceCents: 14000,
        stock: 18,
        sku: "MODA-HOD-01",
        imageUrl:
          "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500&q=80",
        isLiveFeatured: false,
      },
      {
        id: "p-4",
        sellerId: "s-3",
        sellerName: "Aura Skincare",
        categoryId: "cat-3",
        categoryName: "Belleza y Cuidado",
        title: "Kit Serum Facial Ácido Hialurónico + Vit C",
        description:
          "Tratamiento hidratante antiedad apto para todo tipo de piel.",
        priceCents: 8000,
        stock: 40,
        sku: "BEL-SER-01",
        imageUrl:
          "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&q=80",
        isLiveFeatured: false,
      },
    ],
    cart: [],
    orders: [
      {
        id: "ord-demo-1",
        orderNumber: "LB-94821",
        items: [
          {
            product: {
              id: "p-1",
              sellerId: "s-1",
              sellerName: "TikTok Tech Store",
              categoryId: "cat-1",
              categoryName: "Tecnología y Streaming",
              title: "Aro de Luz LED RGB 26cm + Trípode Reforzado",
              description: "Ideal para directos en TikTok Live.",
              priceCents: 13000,
              stock: 25,
              sku: "TECH-ARO-01",
              imageUrl:
                "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=500&q=80",
            },
            quantity: 1,
          },
        ],
        subtotalCents: 13000,
        totalCents: 13000,
        lockBoxPoint: {
          id: "lb-lp-1",
          name: "Tienda Amiga San Pedro",
          address: "Calle Colombia #240 esq. Cañada Strongest",
          city: "La Paz",
          phone: "+591 71234567",
          capacity: 50,
        },
        paymentMethod: "yape",
        status: "paid",
        qrCode: "LBX-QR-ORD94821",
        qrExpiresAt: "2026-10-08T12:00:00.000Z",
        createdAt: "2026-10-01T12:00:00.000Z",
      },
    ],
  };
}
