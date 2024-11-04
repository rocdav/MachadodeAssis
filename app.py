import subprocess
import sys
import pkg_resources

def ensure_latest_gradio():
    """Atualiza o Gradio para a versão mais recente de forma segura."""
    try:
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', '--upgrade', 'gradio'])
        print("Gradio atualizado com sucesso!")
    except Exception as e:
        print(f"Erro ao atualizar Gradio: {e}")

# Verifica e atualiza o Gradio
try:
    current_version = pkg_resources.get_distribution('gradio').version
    print(f"Versão atual do Gradio: {current_version}")
except:
    print("Não foi possível verificar a versão do Gradio")

import gradio as gr

def display_map(view_type):
    """Retorna o iframe do mapa selecionado."""
    if not view_type:
        return '<div style="text-align: center; padding: 20px;">Selecione uma opção para visualizar o mapa</div>'
    
    urls = {
        "Mapa de citações por local": "https://cerulean-crumble-bf9d18.netlify.app/",
        "Mapa de locais citados no conjunto da obra com verbetes": "https://aquamarine-lamington-f1d38d.netlify.app/",
        "Mapa de calor com a frequência de locais citados no conjunto da obra": "https://sprightly-heliotrope-a6037e.netlify.app",
        "Mapa de citações a locais por obra": "https://gregarious-meerkat-7a7b8d.netlify.app/",
        "Mapa de calor de citações por obra": "https://starlit-rabanadas-af1d2b.netlify.app/",
        "Ver endpoint SPARQL": "https://histlearn-jenafuseki.hf.space/#/dataset/Gazetteer/query",
        "Ver Grafos por local": "https://histlearn-showgraph.hf.space"
    }
    
    url = urls.get(view_type, "")
    return f'<iframe src="{url}" width="100%" height="600" frameborder="0"></iframe>'

# CSS simplificado
css = """
<style>
.container { max-width: 1000px; margin: 0 auto; padding: 20px; }
.header-img { width: 100%; max-width: 1000px; height: auto; }
.content { background: white; padding: 20px; border-radius: 10px; }
</style>
"""

# HTML do conteúdo principal
content = f"""
{css}
<div class="container">
    <img src="https://huggingface.co/spaces/histlearn/MachadodeAssis/resolve/main/head.png" alt="Header" class="header-img">
    <div class="content">
        <div style="text-align: center;">
            <h1>Dicionário Geográfico e Literário de Machado de Assis</h1>
            <img src="https://huggingface.co/spaces/histlearn/MachadodeAssis/resolve/main/preprints2.png" alt="SciELO" style="width: 100px;">
            <p><a href="https://preprints.scielo.org/index.php/scielo/preprint/view/9474/version/10010" target="_blank">Leia o manuscrito</a></p>
        </div>
        <p style="font-style: italic; text-align: center;">
            Dom Casmurro morava no Engenho Novo? Você já se perguntou onde fica o Engenho Novo e como ele se relaciona com a trama de Machado de Assis? 
            Nosso projeto te leva a uma viagem no tempo e espaço, desvendando os cenários que inspiraram um dos maiores escritores brasileiros.
        </p>
        <h2>Web Semântica</h2>
        <p>Desenvolvemos uma aplicação web semântica que mapeia as localidades geográficas mencionadas nas obras de Machado de Assis, 
           utilizando dados da enciclopédia <a href="https://machadodeassis.net/" target="_blank">Machadodeassis.net</a>, 
           coordenadas geográficas de Geonames.org e Google Maps.</p>
        <h2>Tecnologia a serviço da Literatura Brasileira</h2>
        <p>Nossa aplicação utiliza modelos de IA para identificar e classificar as localidades mencionadas. 
           Através de consultas SPARQL ao portal <a href="http://dados.literaturabrasileira.ufsc.br" target="_blank">dados.literaturabrasileira.ufsc.br</a>, 
           integramos mapas, citações e textos completos.</p>
        <p style="text-align: right;">por Dilvan de Abreu Moreira e Davi Machado da Rocha</p>
    </div>
</div>
"""

# Interface Gradio
with gr.Blocks() as demo:
    with gr.Column():
        gr.HTML(value=content)
        
        with gr.Box():
            gr.Markdown("""
            ### Como usar
            1. Selecione o tipo de visualização desejada no menu abaixo
            2. O mapa correspondente será carregado automaticamente
            3. Explore os diferentes aspectos das obras de Machado de Assis
            """)
            
            view_type = gr.Radio(
                choices=[
                    "Mapa de citações por local",
                    "Mapa de locais citados no conjunto da obra com verbetes",
                    "Mapa de calor com a frequência de locais citados no conjunto da obra",
                    "Mapa de citações a locais por obra",
                    "Mapa de calor de citações por obra",
                    "Ver endpoint SPARQL",
                    "Ver Grafos por local"
                ],
                label="Selecione a visão do mapa"
            )
            
            map_display = gr.HTML(value='<div style="text-align: center; padding: 20px;">Selecione uma opção para visualizar o mapa</div>')
            
            view_type.change(fn=display_map, inputs=view_type, outputs=map_display)

if __name__ == "__main__":
    ensure_latest_gradio()
    demo.launch()