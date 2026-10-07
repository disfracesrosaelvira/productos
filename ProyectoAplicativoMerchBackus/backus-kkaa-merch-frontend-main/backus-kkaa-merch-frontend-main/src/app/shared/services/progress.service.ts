import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {IResponseService} from "@pages/dto/responseService.dto";

@Injectable({
  providedIn: 'root'
})
export class ProgressService {
  private progressSource = new BehaviorSubject<number>(0);
  progress$ = this.progressSource.asObservable();

  private isSaveEncuesta = new BehaviorSubject<boolean>(false);
  isSaveEncuesta$ = this.isSaveEncuesta.asObservable();

  private isCompleteSku = new BehaviorSubject<boolean>(false);
  isCompleteSku$ = this.isCompleteSku.asObservable();
  private countCompletedSkuSource = new BehaviorSubject<number>(0);
  countCompletedSku$ = this.countCompletedSkuSource.asObservable();

  private isCompletePoc = new BehaviorSubject<boolean>(false);
  isCompletePoc$ = this.isCompletePoc.asObservable();
  private countCompletedPocSource = new BehaviorSubject<number>(0);
  countCompletedPoc$ = this.countCompletedPocSource.asObservable();

  private isCompleteConfigValue = new BehaviorSubject<boolean>(false);
  isCompleteConfigValue$ = this.isCompleteConfigValue.asObservable();
  private countCompletedConfigValueSource = new BehaviorSubject<number>(0);
  countCompletedConfigValue$ = this.countCompletedConfigValueSource.asObservable();

  private isCompleteExhiContraprestada = new BehaviorSubject<boolean>(false);
  isCompleteExhiContraprestada$ = this.isCompleteExhiContraprestada.asObservable();
  private countCompletedExhiContraprestadaSource = new BehaviorSubject<number>(0);
  countCompletedExhiContraprestada$ = this.countCompletedExhiContraprestadaSource.asObservable();

  private isCompleteExhiAdicionalRenovacion = new BehaviorSubject<boolean>(false);
  isCompleteExhiAdicionalRenovacion$ = this.isCompleteExhiAdicionalRenovacion.asObservable();
  private countCompletedExhiAdicionalRenovacionSource = new BehaviorSubject<number>(0);
  countCompletedExhiAdicionalRenovacion$ = this.countCompletedExhiAdicionalRenovacionSource.asObservable();

  private isCompleteExhiCompetenciaRenovacion = new BehaviorSubject<boolean>(false);
  isCompleteExhiCompetenciaRenovacion$ = this.isCompleteExhiCompetenciaRenovacion.asObservable();
  private countCompletedExhiCompetenciaRenovacionSource = new BehaviorSubject<number>(0);
  countCompletedExhiCompetenciaRenovacion$ = this.countCompletedExhiCompetenciaRenovacionSource.asObservable();

  private isCompleteUser = new BehaviorSubject<boolean>(false);
  isCompleteUser$ = this.isCompleteUser.asObservable();

  //encuestas
  private isCompleteEncuestaFrente = new BehaviorSubject<boolean>(false);
  isCompleteEncuestaFrente$ = this.isCompleteEncuestaFrente.asObservable();

  private isCompleteEncuestaStock = new BehaviorSubject<boolean>(false);
  isCompleteEncuestaStock$ = this.isCompleteEncuestaStock.asObservable();

  private isCompleteEncuestaPrecio = new BehaviorSubject<boolean>(false);
  isCompleteEncuestaPrecio$ = this.isCompleteEncuestaPrecio.asObservable();

  private isCompleteEncuestaExhiContraprestada = new BehaviorSubject<boolean>(false);
  isCompleteEncuestaExhiContraprestada$ = this.isCompleteEncuestaExhiContraprestada.asObservable();

  private isCompleteEncuestaExhiAdicional = new BehaviorSubject<boolean>(false);
  isCompleteEncuestaExhiAdicional$ = this.isCompleteEncuestaExhiAdicional.asObservable();

  private isCompleteEncuestaExhiCompetencia = new BehaviorSubject<boolean>(false);
  isCompleteEncuestaExhiCompetencia$ = this.isCompleteEncuestaExhiCompetencia.asObservable();

  private isCompleteEncuestaInciCompetencia = new BehaviorSubject<boolean>(false);
  isCompleteEncuestaInciCompetencia$ = this.isCompleteEncuestaInciCompetencia.asObservable();

  private isCompleteEncuestaInciMuebleAsignacion = new BehaviorSubject<boolean>(false);
  isCompleteEncuestaInciMuebleAsignacion$ = this.isCompleteEncuestaInciMuebleAsignacion.asObservable();

  private isCompleteEncuestaInciMuebleRecojo = new BehaviorSubject<boolean>(false);
  isCompleteEncuestaInciMuebleRecojo$ = this.isCompleteEncuestaInciMuebleRecojo.asObservable();

  private isCompleteEncuestaInciMuebleMantenimiento = new BehaviorSubject<boolean>(false);
  isCompleteEncuestaInciMuebleMantenimiento$ = this.isCompleteEncuestaInciMuebleMantenimiento.asObservable();

  private isCompleteEncuestaExhiAdicionalRenovacion = new BehaviorSubject<boolean>(false);
  isCompleteEncuestaExhiAdicionalRenovacion$ = this.isCompleteEncuestaExhiAdicionalRenovacion.asObservable();

  private isCompleteEncuestaExhiCompetenciaRenovacion = new BehaviorSubject<boolean>(false);
  isCompleteEncuestaExhiCompetenciaRenovacion$ = this.isCompleteEncuestaExhiCompetenciaRenovacion.asObservable();

  private responseService = new BehaviorSubject<IResponseService>({message: '', success: false, data: [], isError: false});
  responseService$ = this.responseService.asObservable();

  updateIsSaveEncuesta(value: boolean) {
    this.isSaveEncuesta.next(value);
  }

  updateResponseService(value: IResponseService) {
    this.responseService.next(value);
  }

  updateProgress(value: number) {
    this.progressSource.next(value);
  }

  updateCountCompletedSku(value: number) {
    this.countCompletedSkuSource.next(value);
  }

  updateCountCompletedPoc(value: number) {
      this.countCompletedPocSource.next(value);
  }

  updateCountCompletedConfigValue(value: number) {
      this.countCompletedConfigValueSource.next(value);
  }

  updateCountCompletedExhiContraprestada(value: number) {
    this.countCompletedExhiContraprestadaSource.next(value);
  }

  updateCountCompletedExhiAdicionalRenovacion(value: number) {
    this.countCompletedExhiAdicionalRenovacionSource.next(value);
  }

  updateCountCompletedExhiCompetenciaRenovacion(value: number) {
    this.countCompletedExhiCompetenciaRenovacionSource.next(value);
  }

  updateIsCompleteSku(value: boolean) {
    this.isCompleteSku.next(value);
  }

  updateIsCompletePoc(value: boolean) {
    this.isCompletePoc.next(value);
  }

  updateIsCompleteUser(value: boolean) {
    this.isCompleteUser.next(value);
  }

  updateIsCompleteExhiContraprestada(value: boolean) {
    this.isCompleteExhiContraprestada.next(value);
  }

  updateIsCompleteExhiAdicionalRenovacion(value: boolean) {
    this.isCompleteExhiAdicionalRenovacion.next(value);
  }

  updateIsCompleteExhiCompetenciaRenovacion(value: boolean) {
    this.isCompleteExhiCompetenciaRenovacion.next(value);
  }

  updateIsCompleteConfigValue(value: boolean) {
    this.isCompleteConfigValue.next(value);
  }

  updateIsCompleteEncuestaFrente(value: boolean) {
    this.isCompleteEncuestaFrente.next(value);
  }

  updateIsCompleteEncuestaStock(value: boolean) {
    this.isCompleteEncuestaStock.next(value);
  }

  updateIsCompleteEncuestaPrecio(value: boolean) {
    this.isCompleteEncuestaPrecio.next(value);
  }

  updateIsCompleteEncuestaExhiContraprestada(value: boolean) {
    this.isCompleteEncuestaExhiContraprestada.next(value);
  }

  updateIsCompleteEncuestaExhiAdicional(value: boolean) {
    this.isCompleteEncuestaExhiAdicional.next(value);
  }

  updateIsCompleteEncuestaExhiCompetencia(value: boolean) {
    this.isCompleteEncuestaExhiCompetencia.next(value);
  }

  updateIsCompleteEncuestaInciCompetencia(value: boolean) {
    this.isCompleteEncuestaInciCompetencia.next(value);
  }

  updateIsCompleteEncuestaInciMuebleAsignacion(value: boolean) {
    this.isCompleteEncuestaInciMuebleAsignacion.next(value);
  }

  updateIsCompleteEncuestaInciMuebleRecojo(value: boolean) {
    this.isCompleteEncuestaInciMuebleRecojo.next(value);
  }

  updateIsCompleteEncuestaInciMuebleMantenimiento(value: boolean) {
    this.isCompleteEncuestaInciMuebleMantenimiento.next(value);
  }

  updateIsCompleteEncuestaExhiAdicionalRenovacion(value: boolean) {
    this.isCompleteEncuestaExhiAdicionalRenovacion.next(value);
  }

  updateIsCompleteEncuestaExhiCompetenciaRenovacion(value: boolean) {
    this.isCompleteEncuestaExhiCompetenciaRenovacion.next(value);
  }

  resetProgress() {
    this.isSaveEncuesta.next(false);
    this.progressSource.next(0);
    this.countCompletedSkuSource.next(0);
    this.countCompletedPocSource.next(0);
    this.countCompletedConfigValueSource.next(0);
    this.countCompletedExhiContraprestadaSource.next(0);
    this.countCompletedExhiAdicionalRenovacionSource.next(0);
    this.countCompletedExhiCompetenciaRenovacionSource.next(0);
    this.isCompleteSku.next(false);
    this.isCompletePoc.next(false);
    this.isCompleteUser.next(false);
    this.isCompleteExhiContraprestada.next(false);
    this.isCompleteEncuestaFrente.next(false);
    this.isCompleteEncuestaStock.next(false);
    this.isCompleteEncuestaPrecio.next(false);
    this.isCompleteEncuestaExhiContraprestada.next(false);
    this.isCompleteEncuestaExhiAdicional.next(false);
    this.isCompleteExhiAdicionalRenovacion.next(false);
    this.isCompleteEncuestaExhiCompetencia.next(false);
    this.isCompleteExhiCompetenciaRenovacion.next(false);
    this.isCompleteEncuestaInciCompetencia.next(false);
    this.isCompleteEncuestaInciMuebleAsignacion.next(false);
    this.isCompleteEncuestaInciMuebleRecojo.next(false);
    this.isCompleteEncuestaInciMuebleMantenimiento.next(false);
    this.isCompleteEncuestaExhiAdicionalRenovacion.next(false);
    this.isCompleteEncuestaExhiCompetenciaRenovacion.next(false);
    this.isCompleteConfigValue.next(false);
    this.responseService.next({message: '', success: false, data: [], isError: false});
  }

}
