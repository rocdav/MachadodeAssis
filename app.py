import sys
import pkg_resources

# Verifica se o Gradio está instalado e a versão é a desejada
try:
    current_version = pkg_resources.get_distribution('gradio').version
    required_version = '5.4.0'  # Altere para a versão necessária

    if current_version != required_version:
        print(f"Versão do Gradio ({current_version}) desatualizada. Tentando atualizar para {required_version}...")
        import pip
        pip.main(['install', '--upgrade', 'gradio'])
    else:
        print(f"Versão atual do Gradio: {current_version}")
except Exception as e:
    print(f"Erro ao verificar ou atualizar o Gradio: {e}")

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

# Restante do código, incluindo a criação da interface com Gradio
description = """
<!-- CSS personalizado e conteúdo HTML omitido para brevidade -->
"""

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