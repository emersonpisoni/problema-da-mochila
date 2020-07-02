import React, { useState, useEffect } from "react";
import "./style.css";

export const World = () => {
  const [tamanhoPopulação, setTamanhoPopulação] = useState(20);
  const [numeroIterações, setNumeroIterações] = useState(30);
  const [porcentagemDaPopulaçãoApta, setPorcentagemDaPopulaçãoApta] = useState(80);
  const [intervaloGeração, setIntervaloGeração] = useState(4);
  const [taxaMutação, setTaxaMutação] = useState(20);
  const [limiarAceite, setLimiarAceite] = useState(90);
  const [pesoMaximoMochila, setPesoMaximoMochila] = useState(50);
  const [pesoMinimoItem, setPesoMinimoItem] = useState(1);
  const [pesoMaximoItem, setPesoMaximoItem] = useState(10);
  const [valorMinimoItem, setValorMinimoItem] = useState(1);
  const [valorMaximoItem, setValorMaximoItem] = useState(10);

  const [shouldGeneratePopulation, setShouldGeneratePopulation] = useState(false);
  const [population, setPopulation] = useState([]);
  const [foundSolution, setFoundSolution] = useState(false);
  const [threshold, setThreshold] = useState(0);
  const [iteraçõesRestantes, setIteraçõesRestantes] = useState(numeroIterações);

  const tamanhoMochila = 10;
  const mochilaPerfeitaValor = tamanhoMochila * valorMaximoItem;

  useEffect(() => {
    setShouldGeneratePopulation(false);
  }, [tamanhoPopulação]);

  useEffect(() => {
    let individuosAdeptos = 0;

    population.forEach((individuo) => {
      if (isAdepto(individuo[individuo.length - 1][0], individuo[individuo.length - 1][1])) {
        individuosAdeptos++;
      }
    });

    const threshold = getPorcentagemAptos(individuosAdeptos, tamanhoPopulação);

    setThreshold(threshold);

    if (threshold < porcentagemDaPopulaçãoApta && population.length && iteraçõesRestantes > 0) {
      setIteraçõesRestantes((iteraçõesRestantes) => iteraçõesRestantes - 1);
      continueGeneration();
      return;
    }

    population.length && threshold >= porcentagemDaPopulaçãoApta && setFoundSolution(true)
  }, [population]);

  function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  const removeNotNumbers = (text) => {
    return text.replace(/\D/g, "");
  };

  const somaArray = (array) => {
    return array.reduce((acc, current) => acc + current, 0);
  };

  const getPorcentagemAptos = (individuosAdeptos, tamanhoPopulação) => {
    return (individuosAdeptos * 100) / tamanhoPopulação;
  };

  const isAdepto = (peso, valor) => {
    return peso <= pesoMaximoMochila && (valor * 100) / mochilaPerfeitaValor >= limiarAceite;
  };

  const getPopulação = (tamanho) => {
    const população = [];

    for (let i = 0; i < tamanho; i++) {
      população.push(getIndividuo());
    }

    return população;
  };

  const getIndividuo = () => {
    const individuo = [];

    for (let i = 0; i < tamanhoMochila; i++) {
      individuo.push([randomIntFromInterval(pesoMinimoItem, pesoMaximoItem), randomIntFromInterval(valorMinimoItem, valorMaximoItem)]);
    }
    const fitness = getFitness(individuo);
    individuo.push(fitness);

    return individuo;
  };

  const getFitness = (individuo) => {
    const arrayPeso = individuo.map((val) => val[0]);
    const arrayValor = individuo.map((val) => val[1]);
    const fitness = [somaArray(arrayPeso), somaArray(arrayValor)];

    return fitness;
  };

  const Individuo = ({ individuo }) => {
    return (
      <div className="individuo">
        <div className="individuo-header">
          {individuo.map((_, index) => {
            const isLastValue = index === individuo.length - 1;
            const value = isLastValue ? "F" : index + 1;

            return <span key={index}>{value}</span>;
          })}
        </div>
        <div style={{ display: "flex", marginRight: -1 }}>
          <div className="individuo-title">
            <span>P</span>
            <span>V</span>
          </div>
          {individuo.map(([peso, valor], index) => {
            const isLastValue = index === individuo.length - 1;
            const getItemClassName = isLastValue && isAdepto(peso, valor) ? "adepto" : isLastValue ? "nao-adepto" : "";
            return (
              <div key={index} className={`item ${getItemClassName}`}>
                <span>{peso}</span>
                <span>{valor}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const População = ({ population }) => {
    return (
      <div className="populacao">
        <span className="populacao-title">População</span>
        {population.map((individuo, index) => (
          <Individuo key={index} individuo={individuo} />
        ))}
      </div>
    );
  };

  const onSubmit = () => {
    setFoundSolution(false);
    setThreshold(0);
    setPopulation(getPopulação(tamanhoPopulação));
    setShouldGeneratePopulation(true);
    setIteraçõesRestantes(numeroIterações);
  };

  const selecionaMelhoresPais = (population) => {
    const individuosDentroDoPesoPositions = [];
    const individuosForaDoPesoPositions = [];

    // filtra por individuos dentro do peso
    const individuosDentroDoPeso = [...population].filter((individuo, index) => {
      const isDentroDoPeso = individuo[individuo.length - 1][0] <= pesoMaximoMochila;

      isDentroDoPeso
        ? individuosDentroDoPesoPositions.push({ index, value: individuo[individuo.length - 1][1] })
        : individuosForaDoPesoPositions.push(index);

      return isDentroDoPeso;
    });

    // ordena individuos dentro do peso pelo valor
    let bestPaisOrderedByValue = individuosDentroDoPeso.sort((a, b) => b[b.length - 1][1] - a[a.length - 1][1]);

    // adiciona individuos fora do peso para ser criado
    // novos individuos caso não tenha individuos dentro do peso suficientes
    if (bestPaisOrderedByValue.length < intervaloGeração) {
      const diff = intervaloGeração - bestPaisOrderedByValue.length;

      for (let i = 0; i < diff; i++) {
        bestPaisOrderedByValue.push(population[individuosForaDoPesoPositions[i]]);
      }
    }

    // adiciona individuos dentro do peso para serem substituídos no crossover
    //  caso não tenha individuos fora do peso suficientes
    if (individuosForaDoPesoPositions.length < intervaloGeração) {
      const diff = intervaloGeração - individuosForaDoPesoPositions.length;

      const pioresMelhores = individuosDentroDoPesoPositions.sort((a, b) => a.value - b.value);

      for (let i = 0; i < diff; i++) {
        individuosForaDoPesoPositions.push(pioresMelhores[i].index);
      }
    }

    // mantém apenas os individuos pelo intervalo de geração
    const bestPais = bestPaisOrderedByValue.slice(0, intervaloGeração);
    const pioresPaisPositions = individuosForaDoPesoPositions.slice(0, intervaloGeração);

    crossOver(bestPais, pioresPaisPositions);
  };

  const crossOver = (bestPais, pioresPaisPositions) => {
    // remove posição de fitness para calcular
    const bestPaisWithoutFitness = bestPais.map((pai) => {
      const array = [...pai];
      return array.splice(0, array.length - 1);
    });

    // cria novos individuos a partir dos melhores pais
    let newPopulationPoint1 = [];
    let newPopulationPoint2 = [];

    const newPopulation = [];

    bestPaisWithoutFitness.forEach((individuo, i) => {
      const isPar = (i + 1) % 2 === 0;
      individuo.forEach((value, j) => {
        const isPoint1 = j < individuo.length / 2;

        isPoint1 ? newPopulationPoint1.push(value) : newPopulationPoint2.push(value);
      });
      if (isPar) {
        newPopulation.push(newPopulationPoint1, newPopulationPoint2);
        newPopulationPoint1 = [];
        newPopulationPoint2 = [];
      }
    });

    // mutação
    const individuosASeremMutados = parseInt((intervaloGeração * taxaMutação) / 100) || 1;
    for (let i = 0; i < individuosASeremMutados; i++) {
      const individuo = [...newPopulation[i]];
      const randomIndividuoPosition = randomIntFromInterval(0, individuo.length - 1);
      const randomPesoValor = [randomIntFromInterval(pesoMinimoItem, pesoMaximoItem), randomIntFromInterval(valorMinimoItem, valorMaximoItem)];

      individuo[randomIndividuoPosition] = randomPesoValor;

      newPopulation[i] = individuo;
    }

    substituiPioresPais(newPopulation, pioresPaisPositions);
  };

  const substituiPioresPais = (newPopulation, pioresPaisPositions) => {
    // remove posição de fitness para calcular
    const currentPopulation = [...population].map((pai) => {
      const array = [...pai];
      return array.splice(0, array.length - 1);
    });

    // currentPopulation recebe a nova população no lugar das posições dos piores pais
    pioresPaisPositions.forEach((position, index) => (currentPopulation[position] = newPopulation[index]));

    for (let i = 0; i < currentPopulation.length; i++) {
      const fitness = getFitness(currentPopulation[i]);

      currentPopulation[i].push(fitness);
    }

    setPopulation(currentPopulation);
  };

  const continueGeneration = () => {
    selecionaMelhoresPais(population);
  };

  const renderPopulation = () => {
    return shouldGeneratePopulation && <População population={population} />;
  };

  return (
    <div className="world">
      <div className="world-container">
        <div className="information">
          ------------------------------------------------
          <span>tamanhoPopulação: {tamanhoPopulação}</span>
          <span>numeroDeIterações: {numeroIterações}</span>
          <span>porcentagemDaPopulaçãoApta: {porcentagemDaPopulaçãoApta}%</span>
          <span>intervaloGeração: {intervaloGeração}</span>
          <span>taxaMutação: {taxaMutação}</span>
          <span>limiarAceite: {limiarAceite}</span>
          <span>pesoMaximoMochila: {pesoMaximoMochila}</span>
          <span>pesoMinimoItem: {pesoMinimoItem}</span>
          <span>pesoMaximoItem: {pesoMaximoItem}</span>
          <span>valorMinimoItem: {valorMinimoItem}</span>
          <span>valorMaximoItem: {valorMaximoItem}</span>
          ------------------------------------------------
          <strong>Solução encontrada? {foundSolution ? "Sim" : "Não"}</strong>
          <strong>Individuos adeptos (%): {threshold}</strong>
          <span>tamanhoMochila: {tamanhoMochila}</span>
          <strong>Iterações restantes: {iteraçõesRestantes}</strong>
          <span>mochilaPerfeitaValor: {mochilaPerfeitaValor}</span>
          <span>tamanho da população não pode ser menor que o intervalo de geração</span>
        </div>
        <div className="form">
          <div>
            <span>Tamanho da população: </span>
            <input value={tamanhoPopulação} onChange={(e) => setTamanhoPopulação(removeNotNumbers(e.target.value))} />
          </div>
          <div>
            <span>Número de iterações: </span>
            <input
              value={numeroIterações}
              onChange={(e) => {
                setNumeroIterações(removeNotNumbers(e.target.value));
                setIteraçõesRestantes(removeNotNumbers(e.target.value));
              }}
            />
          </div>
          <div>
            <span>Porcentagem de população apta: </span>
            <input value={porcentagemDaPopulaçãoApta} onChange={(e) => setPorcentagemDaPopulaçãoApta(removeNotNumbers(e.target.value))} />
          </div>
          <div>
            <span>Intervalo de geração: </span>
            <input value={intervaloGeração} onChange={(e) => setIntervaloGeração(removeNotNumbers(e.target.value))} />
          </div>
          <div>
            <span>Taxa de mutação: </span>
            <input value={taxaMutação} onChange={(e) => setTaxaMutação(removeNotNumbers(e.target.value))} />
          </div>
          <div>
            <span>Limiar de aceite: </span>
            <input value={limiarAceite} onChange={(e) => setLimiarAceite(removeNotNumbers(e.target.value))} />
          </div>
          <div>
            <span>Peso máximo da mochila: </span>
            <input value={pesoMaximoMochila} onChange={(e) => setPesoMaximoMochila(removeNotNumbers(e.target.value))} />
          </div>
          <div>
            <span>Peso mínimo e máximo item: </span>
            <input value={pesoMinimoItem} onChange={(e) => setPesoMinimoItem(removeNotNumbers(e.target.value))} />
            <input value={pesoMaximoItem} onChange={(e) => setPesoMaximoItem(removeNotNumbers(e.target.value))} />
          </div>
          <div>
            <span>Valor mínimo e máximo item: </span>
            <input value={valorMinimoItem} onChange={(e) => setValorMinimoItem(removeNotNumbers(e.target.value))} />
            <input value={valorMaximoItem} onChange={(e) => setValorMaximoItem(removeNotNumbers(e.target.value))} />
          </div>
          <button onClick={onSubmit}>Gerar população</button>
        </div>
      </div>
      {renderPopulation()}
      <button disabled={!population.length} onClick={continueGeneration}>Continuar</button>
      <button disabled={!population.length} onClick={() => setShouldGeneratePopulation(false)}>Cancelar</button>
    </div>
  );
};
