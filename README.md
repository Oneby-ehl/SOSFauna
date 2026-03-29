# Rescate Fauna MVP

Prototipo inicial para una app Android orientada al aviso y orientación básica en rescate de fauna silvestre.

## Objetivo de esta fase

No sustituir WhatsApp, sino mejorar la calidad del aviso que llega al canal habitual de trabajo:

- nombre y teléfono del avisante
- foto del animal
- coordenadas GPS
- indicadores rápidos de urgencia
- observaciones
- guía breve de actuación
- contactos útiles (GREFA, CRAS, Agentes Forestales, 112)

## Decisión de producto

La primera fase mantiene el control operativo en manos del equipo humano. La app **prepara** el aviso y abre WhatsApp con el resumen estructurado.

## Limitación importante

Enviar automáticamente texto, adjuntos y destino exacto de un grupo concreto de WhatsApp desde una app de terceros puede requerir más trabajo y pruebas específicas. En esta base se ha dejado el flujo prudente: preparar el mensaje y abrir WhatsApp.

## Arranque rápido

```bash
npm install
npx expo start
```

Para Android:

```bash
npx expo start --android
```

## Siguiente iteración recomendada

1. Añadir selector real de vídeo.
2. Compartir foto/vídeo hacia WhatsApp con un flujo más pulido.
3. Persistir borradores locales de aviso.
4. Añadir árbol de decisión para volantones, murciélagos y anátidas.
5. Incorporar catálogo editable de contactos por comunidad autónoma.
6. Valorar identificación asistida de especie como ayuda, no como decisión final.
