"use client";
import React from "react";
import Image from "next/image";

export default function SobreNosotrosPage() {
    return (
        <div className="bg-white min-h-screen">
            {/* Hero Section */}
            <section className="relative w-full h-[400px] flex items-center justify-center bg-gradient-to-r from-[#00a19a] to-[#007973] text-white overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                    <Image
                        src="/IG%20Foto%20de%20Perfil.png"
                        alt="Background Pattern"
                        fill
                        className="object-cover"
                    />
                </div>
                <div className="z-10 text-center px-4">
                    <h1 className="text-4xl md:text-6xl font-extrabold mb-4 drop-shadow-lg">Sobre Nosotros</h1>
                    <p className="text-xl md:text-2xl font-light max-w-2xl mx-auto drop-shadow-md">
                        Transformando ideas en realidad tridimensional.
                    </p>
                </div>
            </section>

            {/* Main Content */}
            <section className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    {/* Image/Visual */}
                    <div className="relative h-96 w-full rounded-2xl overflow-hidden shadow-2xl transform hover:scale-[1.02] transition-transform duration-500">
                        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-400 font-bold text-lg">Imagen del Equipo / Taller</span>
                        </div>
                        {/* Placeholder for actual image */}
                        <Image
                            src="/IG%20Foto%20de%20Perfil.png"
                            alt="Nuestro Taller"
                            fill
                            className="object-cover"
                        />
                    </div>

                    {/* Text Content */}
                    <div className="space-y-6">
                        <h2 className="text-3xl md:text-4xl font-bold text-[#007973]">Nuestra Historia</h2>
                        <p className="text-lg text-gray-700 leading-relaxed">
                            En <strong>Thiart3D</strong>, nos apasiona el arte de la impresión y el diseño 3D.
                            Nacimos con la misión de llevar la creatividad más allá de los límites bidimensionales,
                            ofreciendo productos únicos y soluciones personalizadas para cada cliente.
                        </p>
                        <p className="text-lg text-gray-700 leading-relaxed">
                            Creemos que cada objeto cuenta una historia. Ya sea una pieza decorativa para tu hogar,
                            un regalo personalizado o un prototipo para tu empresa, ponemos todo nuestro empeño y
                            tecnología para asegurar la máxima calidad y detalle.
                        </p>

                        <div className="pt-4 grid grid-cols-2 gap-6">
                            <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-[#00a19a]">
                                <h3 className="font-bold text-xl text-gray-900 mb-2">Misión</h3>
                                <p className="text-gray-600">Innovar y materializar sueños a través de la tecnología 3D.</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-[#007973]">
                                <h3 className="font-bold text-xl text-gray-900 mb-2">Visión</h3>
                                <p className="text-gray-600">Ser referentes líderes en diseño y fabricación aditiva.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Team/Values Section */}
            <section className="bg-gray-50 py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-12">Por qué elegirnos</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300">
                            <div className="w-16 h-16 mx-auto bg-[#e0f2f1] rounded-full flex items-center justify-center text-[#007973] text-3xl mb-4">
                                💡
                            </div>
                            <h3 className="text-xl font-bold mb-3">Creatividad sin límites</h3>
                            <p className="text-gray-600">Diseños originales y adaptados a tus necesidades específicas.</p>
                        </div>
                        <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300">
                            <div className="w-16 h-16 mx-auto bg-[#e0f2f1] rounded-full flex items-center justify-center text-[#007973] text-3xl mb-4">
                                ⚙️
                            </div>
                            <h3 className="text-xl font-bold mb-3">Tecnología de Punta</h3>
                            <p className="text-gray-600">Utilizamos las mejores impresoras y materiales del mercado.</p>
                        </div>
                        <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300">
                            <div className="w-16 h-16 mx-auto bg-[#e0f2f1] rounded-full flex items-center justify-center text-[#007973] text-3xl mb-4">
                                ❤️
                            </div>
                            <h3 className="text-xl font-bold mb-3">Pasión por el Detalle</h3>
                            <p className="text-gray-600">Cada pieza es revisada minuciosamente para garantizar la perfección.</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
