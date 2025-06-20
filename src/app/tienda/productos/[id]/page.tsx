"use client";
import { useRouter, useParams } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbSeparator } from "~/components/ui/breadcrumb";
import { useMemo } from "react";

// Simulación de productos (puedes reemplazar por fetch real)
const MOCK_PRODUCTS = [
  {
    id: 1,
    nombre: "Escultura Geométrica",
    desc: "Figura abstracta con formas geométricas entrelazadas. Perfecta para decorar espacios modernos y minimalistas.",
    categoria: "Decoración",
    precio: 29.99,
    stock: 5,
    destacado: true,
    detalles: {
      material: "PLA Premium",
      acabado: "Mate",
      proceso: "Impresión 3D de alta resolución",
      tiempo: "2-3 días",
    },
    tags: ["Decoración", "Abstracto", "Moderno"],
    valoracion: 4.5,
    valoraciones: 28,
    tamanos: [
      { nombre: "Pequeño", precio: 29.99 },
      { nombre: "Mediano", precio: 49.99 },
      { nombre: "Grande", precio: 79.99 },
      { nombre: "Personalizado", precio: 99.99 },
    ],
    imagenes: [
      "/Logo%20Thiart%20Tiktok.png",
      "/Logo%20Thiart%20Tiktok.png",
      "/Logo%20Thiart%20Tiktok.png",
      "/Logo%20Thiart%20Tiktok.png"
    ]
  },
  // ...otros productos
];

export default function ProductoDetallePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  // Busca el producto por id (simulado)
  const producto = useMemo(
    () =>
      MOCK_PRODUCTS.find(
        (p) => String(p.id) === String(id)
      ) || MOCK_PRODUCTS[0],
    [id]
  );

  // Productos relacionados (simulado)
  const relacionados = MOCK_PRODUCTS.filter((p) => p.id !== (producto?.id ?? -1)).slice(0, 4);

  return (
    <div className="bg-white min-h-screen px-8 py-8">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <a href="/tienda" className="text-gray-500 hover:text-black">Inicio</a>
          </BreadcrumbItem>
          <BreadcrumbSeparator>/</BreadcrumbSeparator>
          <BreadcrumbItem>
            <a href="/tienda/productos" className="text-gray-500 hover:text-black">Productos</a>
          </BreadcrumbItem>
          <BreadcrumbSeparator>/</BreadcrumbSeparator>
          <BreadcrumbItem>
            <span className="font-medium text-black">{producto?.nombre}</span>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      {/* Detalle principal */}
      <div className="flex flex-col md:flex-row gap-8 mt-6">
        {/* Galería de imágenes */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            {producto?.imagenes?.map((img, i) => (
              <img
                key={i}
                src={img}
                alt={`Vista ${i + 1}`}
                className="rounded-lg border object-cover aspect-square"
              />
            ))}
          </div>
        </div>
        {/* Info del producto */}
        <div className="flex-1 max-w-xl">
          <div className="flex flex-wrap gap-2 mb-2">
            {producto?.tags?.map((tag) => (
              <span key={tag} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-semibold">{tag}</span>
            ))}
          </div>
          <h1 className="text-3xl font-extrabold mb-1">{producto?.nombre}</h1>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-yellow-500 text-xl">★</span>
            <span className="font-semibold">{producto?.valoracion}</span>
            <span className="text-gray-500 text-sm">({producto?.valoraciones} valoraciones)</span>
          </div>
          <div className="text-2xl font-bold mb-2">${producto?.precio}</div>
          <div className="mb-2">
            <span className="inline-block bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold mr-2">
              En stock
            </span>
            <span className="text-gray-500 text-sm">Envío en 24-48 horas</span>
          </div>
          <hr className="my-4" />
          <div className="mb-4">
            <h2 className="font-bold mb-1">Descripción</h2>
            <p className="text-gray-700">{producto?.desc}</p>
          </div>
          <div className="mb-4">
            <h2 className="font-bold mb-1">Tamaño</h2>
            <div className="grid grid-cols-2 gap-2">
              {producto?.tamanos.map((t) => (
                <Button key={t.nombre} variant="outline" className="justify-start">
                  <div className="flex flex-col items-start">
                    <span className="font-semibold">{t.nombre}</span>
                    <span className="text-xs text-gray-500">${t.precio}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <h2 className="font-bold mb-1">Cantidad</h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon">-</Button>
              <span className="font-semibold">1</span>
              <Button variant="outline" size="icon">+</Button>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button className="flex-1 bg-black text-white">Añadir al Carrito</Button>
            <Button variant="outline" className="flex-1">Añadir a Favoritos</Button>
          </div>
        </div>
      </div>
      {/* Productos relacionados */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold mb-6">Productos Relacionados</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {relacionados.map((prod) => (
            <Card key={prod.id} className="flex flex-col">
              <div className="aspect-square bg-gray-100 rounded-t-lg flex items-center justify-center">
                <span className="text-gray-400 text-4xl">🖼️</span>
              </div>
              <CardHeader>
                <CardTitle className="font-bold text-base">{prod.nombre}</CardTitle>
                <CardDescription className="mb-2">{prod.desc}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col flex-1">
                <div className="flex items-center justify-between mt-auto">
                  <span className="font-bold text-lg">${prod.precio.toFixed(2)}</span>
                  <Button
                    variant="link"
                    onClick={() => router.push(`/tienda/productos/${prod.id}`)}
                  >
                    Ver Detalles
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// Necesario para cargar STL con drei
// Si usas Next.js 13+, agrega esto en el archivo raíz del proyecto:
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
// import { useLoader } from '@react-three/fiber';
// window.THREE = { GLTFLoader };
