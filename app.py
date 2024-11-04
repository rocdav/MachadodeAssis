import subprocess
import sys

# Atualiza o Gradio para a versão mais recente disponível
try:
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', '--upgrade', 'gradio'], 
                          stdout=subprocess.DEVNULL, 
                          stderr=subprocess.DEVNULL)
except Exception as e:
    print(f"Aviso: {e}")

# Verifica e imprime a versão instalada do Gradio
try:
    import pkg_resources
    current_version = pkg_resources.get_distribution('gradio').version
    print(f"Versão atual do Gradio: {current_version}")
except Exception as e:
    print(f"Erro ao verificar a versão do Gradio: {e}")

# Importa Gradio e outras bibliotecas necessárias
import gradio as gr

def display_map(view_type):
    if view_type == "Mapa de citações por local":
        url = "https://cerulean-crumble-bf9d18.netlify.app/"
    elif view_type == "Mapa de locais citados no conjunto da obra com verbetes":
        url = "https://aquamarine-lamington-f1d38d.netlify.app/"
    elif view_type == "Mapa de calor com a frequência de locais citados no conjunto da obra":
        url = "https://sprightly-heliotrope-a6037e.netlify.app"
    elif view_type == "Mapa de citações a locais por obra":
        url = "https://gregarious-meerkat-7a7b8d.netlify.app/"
    elif view_type == "Mapa de calor de citações por obra":
        url = "https://starlit-rabanadas-af1d2b.netlify.app/"
    elif view_type == "Ver endpoint SPARQL":
        url = "https://histlearn-jenafuseki.hf.space/#/dataset/Gazetteer/query"
    elif view_type == "Ver Grafos por local":
        url = "https://histlearn-showgraph.hf.space"
    else:
        url = ""
    
    iframe = f'<iframe src="{url}" width="100%" height="600" frameborder="0"></iframe>'
    return iframe

description = """
<style>
/* CSS personalizado para estilizar a interface */
body {
  font-family: 'Georgia', serif;
  line-height: 1.6;
  background-color: #f2e9e1;
  color: #333;
  margin: 0;
  padding: 0;
  font-size: 16px;
}
.header-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 15px;
}
.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  flex-wrap: wrap;
}
.scielo-link {
  text-align: center;
  margin-right: 20px;
}
.scielo-link img {
  width: 100px;
  margin: 10px;
  max-width: 100%;
}
h1 {
  font-family: 'Garamond', serif;
  font-size: 2.5em;
  text-align: center;
  color: #5d4037;
  margin-top: 20px;
}
h2 {
  color: #5d4037;
  font-family: 'Garamond', serif;
  font-size: 2em;
}
a {
  color: #9e9d24;
  text-decoration: none;
}
.container {
  max-width: 1000px;
  margin: 20px auto;
  padding: 20px;
  background-color: #fff;
  border: 1px solid #ccc;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  position: relative;
  width: 90%;
  box-sizing: border-box;
}
.lead {
  font-style: italic;
  text-align: center;
  font-size: 1.2em;
}
.author {
  text-align: right;
  font-size: 1.2em;
  color: #5d4037;
  font-family: 'Garamond', serif;
  margin-top: 10px;
}
@media (max-width: 600px) {
  body {
    font-size: 14px;
  }
  .header-content {
    flex-direction: column;
    align-items: center;
  }
  .scielo-link {
    order: -1;
    margin-right: 0;
    margin-bottom: 10px;
  }
  .scielo-link img {
    width: 80px;
    margin: 5px;
  }
  h1 {
    font-size: 1.8em;
  }
  h2 {
    font-size: 1.5em;
  }
  .lead {
    font-size: 1em;
  }
  .container {
    padding: 15px;
    margin: 10px auto;
  }
  .author {
    font-size: 1em;
  }
}
</style>
<div class="container">
  <!-- Conteúdo HTML do app -->
</div>
"""

# Criação da interface com o Gradio Blocks
with gr.Blocks(css=description) as demo:
    gr.HTML(description)
    with gr.Column(elem_classes="container"):
        gr.Markdown("""
        ## Como usar
        1. Selecione o tipo de visualização desejada no menu abaixo.
        2. O mapa correspondente será carregado automaticamente.
        3. Explore os diferentes aspectos das obras de Machado de Assis através dos mapas interativos.
        4. É possível fazer consultas SPARQL ao arquivo de dados através do Jena Fuseki.
        5. Os grafos das consultas aos locais também estão disponíveis.
        """)

        with gr.Column(elem_classes="controls"):
            view_type = gr.Radio(
                ["Mapa de citações por local",
                 "Mapa de locais citados no conjunto da obra com verbetes",
                 "Mapa de calor com a frequência de locais citados no conjunto da obra",
                 "Mapa de citações a locais por obra",
                 "Mapa de calor de citações por obra",
                 "Ver endpoint SPARQL",
                 "Ver Grafos por local"],
                label="Selecione a visão do mapa"
            )
    
    with gr.Column(elem_classes="map-container"):
        map_display = gr.HTML()

    # Atualiza o iframe com base na seleção do usuário
    view_type.change(fn=display_map, inputs=view_type, outputs=map_display)

if __name__ == "__main__":
    demo.launch()