// Reportes Components - Barrel Export
export { ReporteFiltros, type ReporteFiltrosData } from './ReporteFiltros'
export { ConteoSliderHorario } from './ConteoSliderHorario'
export { ReportePreview } from './ReportePreview'
export {
  type ReporteData,
  type ReporteNovedadesData,
  type ReporteConteoData,
  type ReporteConsolidadoData,
  generateReportePDF,
  getReporteTitulo,
  getReporteFilename,
} from './ReportePDF'

// Informe Disciplinario PDF
export {
  type InformeDisciplinarioData,
  generateInformeDisciplinarioPDF,
  getInformeDisciplinarioFilename,
  eventToInformeDisciplinario,
} from './InformeDisciplinarioPDF'
